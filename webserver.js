var http = require('http'),
url = require('url'),
fs = require('fs');

/** 
 * Adding a convenient .format() function to the String object. In a more formal context, I 
 * would make this part of a utility module that I would require().
 * Reference: http://stackoverflow.com/questions/610406/javascript-equivalent-to-printf-string-format
 */
String.prototype.format = function() {
    var formatted = this;
    for (var i = 0; i < arguments.length; i++) {
        var regexp = new RegExp('\\{'+i+'\\}', 'gi');
        formatted = formatted.replace(regexp, arguments[i]);
    }
    return formatted;
};

/**
 * Here's where we define all of the behavior for our web server
 */
var server = http.createServer(function (req, res) {

  var path = url.parse(req.url).pathname; 
  
  // I've changed my switch statement to allow me to evaluate regular expression 
  // matches in the cases
  switch (true){

    case (path.match(/\/user\/[a-z]*/g) != null):
      displayUser(path.split('/')[2], res);
    break;

    case path=='/':
      fs.readFile(__dirname + '/index.html', function(err, data){
        if (err) return send404(res);
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data, 'utf8');
        res.end();
      });
    break;

    case path=='/test':
      res.writeHead(200, {'Content-Type': 'text/plain'});
          res.write('It works!\n');
          res.end();
      break;

    case path=='/twitter':
      fs.readFile(__dirname + '/twitter.html', function(err, data){
        if (err) return send404(res);
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data, 'utf8');
        res.end();
      });
    break;

    case path=='/register':
      fs.readFile(__dirname + '/register.html', function(err, data){
        if (err) return send404(res);
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write(data, 'utf8');
        res.end();
      });
    break;

    case path=='/users/new':

      if(req.method == 'POST') {

        // grab posted data from the form
        req.on('data', function(chunk) {
          var username = chunk.toString().split('=')[1];
          // now that we have the username, regsiter it in our user directory
          registerUser(username);

          // redirect the client to the newly registered user's page
          res.writeHead(302, {
            // redirection is easy, just send a 302 and change the path. In 
            // this case, we replace users/new in the path with user/<username>
            'Location': path.replace('users/new', 'user/'+username),
            'Content-Type': 'text/html'
          });
          res.end();
        });    
      }
    break;
                 
    default: send404(res);
  }
}),

/** 
 * This function takes a username and a response object. It searches 
 * for the username in the users.dat file, and calls the sendUser() 
 * function if it finds the user. Otherwise, it sends a 404 response. 
 */
displayUser = function(username, res) {
  console.log('Requested username = ' + username);

  // look for user in file
  fs.readFile(__dirname + '/users.dat', function(err, data){
    if (err) return send404(res);

    var users = String(data).split(':');
    var found = false;
    for(i in users) {
      console.log('checking user ' + users[i]);
      if(users[i] == username) found = true;
    }

    if(!found) {
      console.log('User not found');
      return send404(res);
    }

    console.log('User ' + username + ' found');
    sendUser(res, username);
  });
}

/** 
 * To register users in a more permanent manner (i.e. keep them even if our Node 
 * web server application goes down), I've chosen to simply store them in a file. 
 * In a more advanced application, this could easily be stored in a database.
 */
registerUser = function(username) {
  // append username to a file for persistence
  console.log('Writing user ' + username + ' to file');
  fs.appendFile(__dirname + '/users.dat', username + ':');
}

/** 
 * This function sends the client to a page with the twitter widget hard-coded to 
 * a specific user. I'm doing this by simply reading in the template.html file, and 
 * replacing a strategically placed string {0} with with username extracted from the 
 * url path. Then I'm returning the customized string (which is html) to the client.
 */
sendUser = function(res, user) {
  fs.readFile(__dirname + '/template.html', function(err, data){
    if (err) return send404(res);
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.write(String(data).format(user), 'utf8');
    res.end();
  });
}

/** 
 * Same old simple 404 return. No pretty error pages for us!
 */
send404 = function(res) {
  res.writeHead(404); 
  res.write('404'); 
  res.end();  
};


server.listen(8181, "127.0.0.1");
console.log('Server running at http://127.0.0.1:8181/');

