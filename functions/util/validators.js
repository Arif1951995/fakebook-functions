const isEmpty = str => str.trim() === '';
const isEmail = email => {
 const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return email.match(regex)
}

exports.validateSignupData = (data) => {
    let errors = {};
  if(isEmpty(data.email)) errors.email = "email must not be empty" 
  else if(!isEmail(data.email)) errors.email = "must be valid email";
  isEmpty(data.password) && (errors.password = "password must not be empty");
  data.password !== data.confirmPassword && (errors.confirmPassword = "passwords must match");
  isEmpty(data.handle) && (errors.handle = "handle must not be empty");
  
  return {
      errors,
      valid: Object.keys(errors).length === 0
  }
}

exports.validateLoginData = (data) => {
    let errors = {};
    isEmpty(data.email) && (errors.email = "email must not be empty");
    isEmpty(data.password) && (errors.password = "password must not be empty");
  
    return {
        errors,
        valid: Object.keys(errors).length === 0
    }
}

exports.reduceUserDetails = data => {
    let userDetails = {};
    if(!isEmpty(data.bio.trim())) userDetails.bio = data.bio.trim();
    if(!isEmpty(data.website.trim())) {
        if(data.website.trim().substring(0, 4) !== 'http') {
            userDetails.website = `http://${data.website.trim()}`
        }else userDetails.website = data.website
    }
    if(!isEmpty(data.location.trim())) userDetails.location = data.location.trim();

    return userDetails

}