function dangky(){
var username = document.getElementById('username').value;
var email = document.getElementById('email').value;
var password = document.getElementById('password').value;
var cfpassword = document.getElementById('cfpassword').value;
var regex = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

      if(username == null || username == ""){
            document.getElementById('usname').innerHTML = "Invalid!";
            return false;
      }
       else if (regex.test(email)==false){
            document.getElementById('mail').innerHTML = "Invalid!";
            return false;
       }
       else if(password ==  null || password ==""){
            document.getElementById('pass').innerHTML = "Invalid!";
            return false;
       }
       else if(password.length<6 || password.length>20) {
            document.getElementById('pass').innerHTML = "Password must be more than 6 characters!";
            return false;
       }
       else if (cfpassword != password){
            document.getElementById('cfpass').innerHTML = "Password incorrect!";
            return false;
       }
       else {
            document.getElementById('check').innerHTML = "Successful!";
            return false;
       }
}
