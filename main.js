$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return results[1] || 0;
    }
};
var doctoload = $.urlParam('doc');

console.log(doctoload);





$('document').ready(function (e){
	$('#editor').hide();
	$('#deletedocfab').hide();
	firebase.auth().getRedirectResult().then(function(result) {
  if (result.credential) {
    // This gives you a Google Access Token. You can use it to access the Google API.
    var token = result.credential.accessToken;
    // ...
  }
  // The signed-in user info.
  var user = result.user;
}).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  // The email of the user's account used.
  var email = error.email;
  // The firebase.auth.AuthCredential type that was used.
  var credential = error.credential;
  // ...
});
	
$('.logout').hide();
	console.log('logout hidden');
	$('.login').click(function (e){
		$('#loader').show();
		firebase.auth().signInWithRedirect(provider);
	});
	$('.logout').click(function (e){
		$('#loader').show();
		firebase.auth().signOut().then(function() {
		  // Sign-out successful.
			  Materialize.toast('Sign out successful', 4000);
			$('#loader').hide();
			location.reload();
		}, function(error) {
		  // An error happened.
			  Materialize.toast(error, 4000);
			$('#loader').hide();
		});
	});
	
	
	
	firebase.auth().onAuthStateChanged(function(user) {
  if (user) {
	  $('#newdocfab').show();
	  $('.logout').show();
	  $('.login').hide();
	  var user = firebase.auth().currentUser;
		var name, email, photoUrl, uid, emailVerified;

		if (user != null) {
		  name = user.displayName;
		  email = user.email;
		  photoUrl = user.photoURL;
		  emailVerified = user.emailVerified;
		  uid = user.uid;  // The user's ID, unique to the Firebase project. Do NOT use
						   // this value to authenticate with your backend server, if
						   // you have one. Use User.getToken() instead.
		}
	  	if (doctoload) {
			var docloadRef = firebase.database().ref('docs/users/' + uid + '/docs/' + doctoload);
			var content;
			$('#editor').show();
			$('#newdocfab').hide();
			$('#deletedocfab').show();
			$('.tooltipped').tooltip({delay: 50});
			$('#deletethisdoc').click(function (e) {
				var updates = {};
			  updates['docs/users/' + uid + '/docs/' + doctoload] = null;
			   firebase.database().ref().update(updates);
				window.location = "index.html";
			});
			docloadRef.once('value').then(function(snapshot) {
				if (! snapshot.val()) {
					window.location = "index.html";
				}
			  var content = snapshot.val().content;
				 var name = snapshot.val().name;
				var dcrname = blowfish.decrypt( name,  uid,  {outputType: 1, cipherMode: 0})
				var doctitle = 'Docs | ' + dcrname;
				$('#documentname').text(dcrname)
				document.title = doctitle;
				console.log(doctitle);
				
				
			var	dcryptedcontent = blowfish.decrypt( content,  uid,  {outputType: 1, cipherMode: 0})
				
			 
				$('#beta-editor').html(dcryptedcontent);
				$('#loader').hide();
				$("#saved").click(function() {
					var currentcontent = $('#beta-editor').html();
					var currentname = $('#documentname').text();
					var enccontnet = blowfish.encrypt( currentcontent,  uid,  {outputType: 1, cipherMode: 0});
					var encname = blowfish.encrypt( currentname,  uid,  {outputType: 1, cipherMode: 0});
					 var updates = {};
					updates['docs/users/' + uid + '/docs/' + doctoload + '/content'] = enccontnet;
					
					firebase.database().ref().update(updates);
					var updates = {};
					updates['docs/users/' + uid + '/docs/' + doctoload + '/name'] = encname;
					
					firebase.database().ref().update(updates);
					$("#save-text").text("Saved");
					
				});
				
			});
			docloadRef.on('value', function(snapshot) {
				content = snapshot.val().content;
				name = snapshot.val().name;
				setInterval( function() {
					var currentcontent = $('#beta-editor').html();
				
					var currentname = $('#documentname').text();
					var encname = blowfish.encrypt( currentname,  uid,  {outputType: 1, cipherMode: 0});
			
				var enccontnet = blowfish.encrypt( currentcontent,  uid,  {outputType: 1, cipherMode: 0})
					
				if (enccontnet == content) {
					
					$("#save-text").text("Saved");
				} else {
					
					$("#save-text").text("Unsaved");
				}
					if (encname == name) {
					
					$("#save-text").text("Saved");
				} else {
					
					$("#save-text").text("Unsaved");
				}
				}, 300);
				
				
				setInterval(function(){ 
				var currentcontent = $('#beta-editor').html();;
				
				var enccontnet = blowfish.encrypt( currentcontent,  uid,  {outputType: 1, cipherMode: 0})
					
				if (enccontnet == content) {
				
					$("#save-text").text("Saved");
				} else {
						var currentname = $('#documentname').text();
					var encname = blowfish.encrypt( currentname,  uid,  {outputType: 1, cipherMode: 0});
					  var updates = {};
					updates['docs/users/' + uid + '/docs/' + doctoload + '/content'] = enccontnet;
					
					firebase.database().ref().update(updates);
					updates['docs/users/' + uid + '/docs/' + doctoload + '/name'] = encname;
					
					firebase.database().ref().update(updates);
					$("#save-text").text("Saved");
				}
					var currentname = $('#documentname').text();
					var encname = blowfish.encrypt( currentname,  uid,  {outputType: 1, cipherMode: 0});
				if (encname == name) {
				
					$("#save-text").text("Saved");
				} else {
						
					  var updates = {};
				
					
					firebase.database().ref().update(updates);
					updates['docs/users/' + uid + '/docs/' + doctoload + '/name'] = encname;
					
					firebase.database().ref().update(updates);
					$("#save-text").text("Saved");
				}
				
				
				
				}, 2000);
				
				
				
				
				}); 
			
			
		} else {
			console.log('no doc loading');
			
			firebase.database().ref('docs/users/' + uid + '/userinfo').set({
		username: name,
		email: email,
		profile_picture : photoUrl
		});
			
		 firebase.database().ref('docs/users/' + uid + '/settings/welcomedoc').once('value').then(function(snapshot) {
		  var docisthere = snapshot.val();
			 if (!docisthere) {
				 var encwelcome = blowfish.encrypt( "Welcome to Brainstorm Inc Docs",  uid,  {outputType: 1, cipherMode: 0})
				 var encwelcomename = blowfish.encrypt( "Welcome",  uid,  {outputType: 1, cipherMode: 0})
				var welcomedocRef = firebase.database().ref('docs/users/' + uid + '/docs/').push();
				welcomedocRef.set({
					name: encwelcomename,
					content: encwelcome// ...
				});
				firebase.database().ref('docs/users/' + uid + '/settings/welcomedoc').set({
					made: true,
					
				  });
				
			 }
		  
		});
	  	
	  	var docsRef = firebase.database().ref('docs/users/' + uid + '/docs/');
		docsRef.on('child_added', function(data) {
			$('#loader').hide();
		   var currentDocKey = data.key;
		   var currentDocName = data.val().name;
		   console.log(currentDocKey + " " + currentDocName);
			var dcryptdocname = blowfish.decrypt( currentDocName,  uid,  {outputType: 1, cipherMode: 0})
			var documentredirecturl = 'index.html?doc=' + currentDocKey;
			$('#content').prepend('<div style=" margin: 1%; width: 48%; float: left;"><a href="' + documentredirecturl +'"><div style=" position: relative;" class="hoverable docbtn card-panel"><p class="doctxt grey-text text-darken-3" style="bottom: 50px; line-height: normal;"><i class="material-icons green-text text-lighten-1">insert_drive_file</i>&nbsp;' + dcryptdocname + '</p></div></a></div>');
		});
		}
	  	$('#canceldelete').click(function (e) {
			$('#loader').hide();
		});
	  	$("#deletedoc").click(function (e) {
			$('#loader').show();
			 $('.modal').modal();
			$('#modal2').modal('open');
		});
	  $("#newDoc").click(function (e) {
			$('#loader').show();
			 $('.modal').modal();
			$('#modal1').modal('open');
		});
	  $("#newdocsubmit").click(function (e) {
			var newname = $('#newdocname').val();
		  console.log(newname);
		 var encnewname = blowfish.encrypt( newname,  uid,  {outputType: 1, cipherMode: 0})
		  var newDocRef = firebase.database().ref('docs/users/' + uid + '/docs/').push();
			newDocRef.set({
				name: encnewname,
				content: ""
			});
		});
	  
	  
	  	
    // User is signed in..........
  } else {
	  $('.logout').hide();
	  $('.login').show();
	   var $toastContent = $('<span>Please <span style="font-weight: 500;">login</span> to use Docs</span>');
  Materialize.toast($toastContent, 5000);
	  $('#loader').hide();
	  $('#editor-text').val("");
	  
	
    // No user is signed in.
  }
});
	
	
	
	
	
});
