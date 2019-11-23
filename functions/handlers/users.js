const { admin, db } = require("../util/admin");
const firebase = require("firebase");

const config = require("../util/config");
const { validateSignupData, validateLoginData, reduceUserDetails } = require("../util/validators");

firebase.initializeApp(config);

exports.signup = (req, res) => {
  const newUser = {
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    handle: req.body.handle
  };

  const { errors, valid } = validateSignupData(newUser);

  if (!valid) return res.status(400).json(errors);

  let noImg = "no-img.png"


  let token, userId;

  db.doc(`/users/${newUser.handle}`)
    .get()
    .then(doc => {
      if (doc.exists) {
        return res.status(400).json({ handle: "this handle already taken" });
      } else {
        return firebase
          .auth()
          .createUserWithEmailAndPassword(newUser.email, newUser.password);
      }
    })
    .then(data => {
      userId = data.user.uid;
      return data.user.getIdToken();
    })
    .then(idToken => {
      token = idToken;
      const userCredentials = {
        handle: newUser.handle,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        imageUrl: `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${noImg}?alt=media`,
        userId
      };
      return db.doc(`users/${newUser.handle}`).set(userCredentials);
    })
    .then(() => {
      return res.status(201).json({ token });
    })

    .catch(err => {
      console.error(err);

      if (err.code === "auth/email-already-in-use") {
        return res.status(400).json({ email: "Email is already in use" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
};

exports.login = (req, res) => {
  const user = {
    email: req.body.email,
    password: req.body.password
  };
  const { errors, valid } = validateLoginData(user);

  if (!valid) return res.status(400).json(errors);

  firebase
    .auth()
    .signInWithEmailAndPassword(user.email, user.password)
    .then(data => {
      return data.user.getIdToken();
    })
    .then(token => {
      return res.json({ token });
    })
    .catch(err => {
      console.error(err);
      if (err.code === "auth/wrong-password") {
        return res.status(403).json({ general: "worng credential, try again" });
      } else {
        return res.status(500).json({ error: err.code });
      }
    });
};

// add user details

exports.addUserDetails = (req, res) => {
  let userDetails = reduceUserDetails(req.body);


   db.doc(`/users/${req.user.handle}`).update(userDetails)
   .then(data => {
     return res.json({message: "details added successfully"})
   })
   .catch(err => {
     console.error(err);
     return res.status(500).json({error: err.code})
   })
}

exports.getAuthenticatedUser = (req, res) => {
  let userData = {};
  db.doc(`/users/${req.user.handle}`).get()
  .then(doc => {
    if(doc.exists) {
      userData.credentials = doc.data();
      db.collection('likes').where('userHandle', '==', req.user.handle).get()
      .then(data => { 
        userData.likes = [];
        data.forEach(doc => {
          userData.likes.push(doc.data())
        })
        return res.json(userData)

      })
      .catch(err => {
        console.error(err)
        return res.status(500).json({error: err.code})
      })
    }
  })
}

 

exports.uploadImage = (req, res) => {
  const BusBoy = require("busboy");
  const path = require("path");
  const os = require("os");
  const fs = require("fs");

  const busboy = new BusBoy({ headers: req.headers });
  let imageFileName;
  let imageToBeUploaded = {};
  busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
    console.log(fieldname, filename, mimetype);
    if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
            return res.status(400).json({ error: 'Wrong file type submitted' });
          }
    const imageExtension = filename.split(".")[filename.split(".").length - 1];
    imageFileName = `${Math.round(Math.random() * 100000)}.${imageExtension}`;
    const filePath = path.join(os.tmpdir(), imageFileName);

    imageToBeUploaded = { filePath, mimetype };
    file.pipe(fs.createWriteStream(filePath));
  });
  busboy.on("finish", () => {
    admin
      .storage()
      .bucket()
      .upload(imageToBeUploaded.filePath, {
        resumable: false,
        metadata: {
          contentType: imageToBeUploaded.mimetype
        }
      })
      .then(() => {
        const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imageFileName}?alt=media`
        return db.doc(`users/${req.user.handle}`).update({imageUrl})
      })
      .then(() => {
        return res.json({ message: "image uploaded successfully" })
      })
      .catch(err => {
        console.error(err);
        return res.status(500).json({error: err.code})
      })
  });
  busboy.end(req.rawBody);
};









