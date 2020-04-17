$(document).ready(function () {  // wait till the document is ready and the datas are loaded to show
    $("#doc").hide();   
    $("#for").hide();
    $("#sign-in-or-out-button").hide();
    $("#auth-status").hide();
    $("#selection").hide();
});




var GoogleAuth;
var afficher = 0 ;
  var SCOPE = "https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/spreadsheets.readonly";

  function handleClientLoad() {
    // Load the API's client and auth2 modules.
    // Call the initClient function after the modules load.
    gapi.load('client:auth2', initClient);
  }

  function initClient() {
    // Retrieve the discovery document for version 3 of Google Drive API.
    // In practice, your app can retrieve one or more discovery documents.
    var discoveryUrl = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest", "https://sheets.googleapis.com/$discovery/rest?version=v4" ];

    // Initialize the gapi.client object, which app uses to make API requests.
    // Get API key and client ID from API Console.
    // 'scope' field specifies space-delimited list of access scopes.
    gapi.client.init({
        'apiKey': 'AIzaSyCVznfFyrGhoi8LyOjIxacZq--nmytFqPQ',
        'clientId': '306405626082-4s1qmqvujg5sg2vk5j4ubv7uend0ogac.apps.googleusercontent.com',
        'discoveryDocs': discoveryUrl,
        'scope': SCOPE
    }).then(function () {
      GoogleAuth = gapi.auth2.getAuthInstance();

      // Listen for sign-in state changes.
      GoogleAuth.isSignedIn.listen(updateSigninStatus);

      // Handle initial sign-in state. (Determine if user is already signed in.)
      var user = GoogleAuth.currentUser.get();
      setSigninStatus();

      // Call handleAuthClick function when user clicks on
      //      "Sign In/Authorize" button.
      $("#sign-in-or-out-button").toggle();
   	  $("#auth-status").toggle();
      $('#sign-in-or-out-button').click(function() {
        handleAuthClick();
      });
    });
  }

  function handleAuthClick() {
    if (!GoogleAuth.isSignedIn.get()) {
      // User is authorized and has clicked "Connect API" button.
      GoogleAuth.signIn().then(execute) ;
    } 
      
    
  }

  function setSigninStatus(isSignedIn) {
    var user = GoogleAuth.currentUser.get();
    var isAuthorized = user.hasGrantedScopes(SCOPE);
    if (isAuthorized) {
      $('#sign-in-or-out-button').toggle();
      $('#auth-status').html('You are currently signed in and have granted ' +
          'access to this app.');
    } else {
      $('#auth-status').html('You have not authorized this app or you are ' +
          'signed out.');
    }
  }

  function updateSigninStatus(isSignedIn) {
    setSigninStatus();
  }

  function execute() {
    $('#load').html('Loading your data..');
    return gapi.client.drive.files.list({"pageSize" : 1000})
        .then(function(response) {
                // Handle the results here (response.result has the parsed body).
                y = []; // contains the name of the spreadsheets in your drive
                z = []; // contains the id of the spreadsheets in your drive
                for (var k=0 ; k<response.result.files.length ; k++) { 
                  if (response.result.files[k].mimeType==="application/vnd.google-apps.spreadsheet") {
                    y.push(response.result.files[k].name) ;
                    z.push(response.result.files[k].id);
                  }
                }
                ajout_select();
              },
              function(err) { console.error("Execute error", err); });
  }

  function ajout_select() { // file the select with your spreadsheets and show it.
    var element = document.getElementById('doc'); 
    if (afficher==0) {
      for (var k=0 ; k<y.length ; k++) {    
        element.options[k] = new Option(y[k], y[k], true, true);

    }
    element.options.selectedIndex = 0 ; 
    $("#load").html('');
    $("#doc").toggle();
    $("#for").toggle();
    $("#selection").toggle();
    }
    afficher = 1 ; // pour ne mettre a jour qu'une fois
  }

  function get_id(name) { // returns the id of the spreadsheet called 'name'
    for (let k = 0 ; k<y.length ; k++) {
      if (y[k]==name) {return z[k] ;}
    }
  }

  function get_name(id) { // returns the id of the spreadsheet called 'name'
    for (let k = 0 ; k<z.length ; k++) {
      if (z[k]==id) {return y[k] ;}
    }
  }

  function data(id) { // update the document with the provided id.
  	var ranges = 'A!A1:YY'; // take all the document (sheet A)
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: id,
        range: ranges,
        }).then(function(response) {	
            var resultat_A = response.result;
            ranges = 'B!A1:YY'; // sheet B
            gapi.client.sheets.spreadsheets.values.get({
          	    spreadsheetId: id,
          		range: ranges,
        	}).then(function(reponse) {
	        	var resultat_B = reponse.result ;
	        	var resultat_C = mix(resultat_A.values,resultat_B.values) ; // merge the two tables
	        	var values = resultat_C ;
				var body = {
					"majorDimension": "ROWS",
					"values": values
						};
				gapi.client.sheets.spreadsheets.values.update({
					spreadsheetId: id,
					range: 'C!A1:YY',  // update sheet C with the merged values
					valueInputOption: 'RAW',
					resource: body
				}).then((response) => {
					var result = response.result;
					var elmt = document.getElementById("load");
					$('#load').html("File '" + get_name(id) + "' has been deduplicated.") ; 
					elmt.style.color = "red" ; 
				});
			});
    	});
    }

  function deduplicate() {
  	$('#load').html("Processing Data..") ; 
  	var id = get_id(document.getElementById('doc').value) ; // get the id selected
      data(id) ; 
  }

  function mix(A,B) {
  	var resultat = [];  
  	if (A.length<B.length) {
  		var C = A ;
  		A = B ;
  		B = C ; 
  	}
  	var nb_A = A.length ; 
  	var nb_B = B.length ; 
  	var nb_col = A[0].length;
  	var ligne_1 = [] ;
  	for (var k =0 ; k < A[0].length ; k++)  {
	  	ligne_1.push(A[0][k]) ; // We suppose the first row will always be completed
	}
	for (var k =0 ; k < B[0].length ; k++)  {
		if (!ligne_1.includes(B[0][k])) {
	  		ligne_1.push(B[0][k]) ; // We suppose the first row will always be completed
	  		nb_col++;
	    } 
	}
	resultat.push(ligne_1);
	for (let i = 1 ; i<nb_A ;i++) {
		let ligne = [] ;
		for (var k =0 ; k < A[0].length ; k++)  {
	  		ligne.push(A[i][k]) ; // even the "" to keep the increment right
		}
		for (var k = 0 ; k< nb_col-A[0].length ;k++) {
			ligne.push('') ; 
		}
		if (i<nb_B) {
			for (let k = 0 ; k<B[i].length ;k++) {
				var titre = B[0][k] ;
				var pos = ligne_1.indexOf(titre) ;
				if (ligne[pos]=="" || ligne[pos]=='undefined' || (Math.random() > 0.5 && B[i][k] != '' )) { // we do not favor A over B
					ligne[pos] = B[i][k] ; 
				}
			}
		}
		resultat.push(ligne) ;
	}
  	return resultat ; 
  }

