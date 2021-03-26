//Set PLaylist Name
const playlistName = 'PLAYLIST GENERATOR';

let playlistIDNum;



$( document ).ready(function() {
     // Helper Function to Extract Access Token for URL
    const getUrlParameter = (sParam) => {
      let sPageURL = window.location.search.substring(1),////substring will take everything after the https link and split the #/&
          sURLVariables = sPageURL != undefined && sPageURL.length > 0 ? sPageURL.split('#') : [],
          sParameterName,
          i;
      let split_str = window.location.href.length > 0 ? window.location.href.split('#') : [];
      sURLVariables = split_str != undefined && split_str.length > 1 && split_str[1].length > 0 ? split_str[1].split('&') : [];
      for (i = 0; i < sURLVariables.length; i++) {
          sParameterName = sURLVariables[i].split('=');
          if (sParameterName[0] === sParam) {
              return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
          }
      }
  };

    // Get Access Token
    const accessToken = getUrlParameter('access_token');

    //Set Artist Location JSON variable
    var artistLoc = (function() {
      var artistLoc = null;
      $.ajax({
        'async': false,
        'global': false,
        'url': "/artist_location.json",
        'dataType': "json",
        'success': function(data) {
          artistLoc = data;
        }
      });
      return artistLoc;
    })();




    // AUTHORIZE with Spotify (if needed)
    // *************** REPLACE THESE VALUES! *************************
    let client_id = 'e8714888680a477cb0afc745df9c8030';
    // Use the following site to convert your regular url to the encoded version:
    // https://www.url-encode-decode.com/
    let redirect_uri = 'http%3A%2F%2F127.0.0.1%3A5500%2F'; // https%3A%2F%2Fnoginblast.github.io%2FSpotifyPlaylistGenerator%2F  http%3A%2F%2F127.0.0.1%3A5500%2F
    // *************** END *************************

    const redirect = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=token&redirect_uri=${redirect_uri}&scope=playlist-modify-private%20playlist-modify-public`;
    // Don't authorize if we have an access token already
    if(accessToken == null || accessToken == "" || accessToken == undefined){
      window.location.replace(redirect);
    }

    // Search button has been clicked
    $( "#search_button" ).click(function() {
      //Get the value of the search box
      let raw_search_query = $('#search-text').val();
      let search_query = encodeURI(raw_search_query);

      let date = new Date();
      let playlistDescription = date.toString();
      
      
      createPlaylist(accessToken, playlistName, playlistDescription);

      // Make Spotify API call
      // Note: We are using the track API endpoint.
      
     



      $.ajax({
      url: `https://api.spotify.com/v1/search?q=${search_query}&type=track`,
      type: 'GET',
      headers: {
          'Authorization' : 'Bearer ' + accessToken
      },
      success: function(data) {
        // Load our songs from Spotify into our page
        let num_of_tracks = data.tracks.items.length;
        let count = 0;
        // Max number of songs is 12
        const max_songs = 12;


        while(count < max_songs && count < num_of_tracks){
          // Extract the id of the FIRST song from the data object
          let id = data.tracks.items[count].id;
          let uri = data.tracks.items[count].uri;

          //Add music to the appication playlist
          addSong(accessToken, playlistIDNum, uri);


          // Constructing two different iframes to embed the song
          let src_str = `https://open.spotify.com/embed/track/${id}`;
          let iframe = `<div class='song'><iframe src=${src_str} frameborder="0" allowtransparency="true" allow="encrypted-media"></iframe></div>`;
          let parent_div = $('#song_'+ count);
          parent_div.html(iframe);
          count++;
        }
      }
      });
         // End of Spotify ajax call
    }); // End of search button
  }); // End of document.ready


/*This method manages the Application playlist in regards
   to creation and deletion*/
  let createPlaylist = function(accessToken, playlistName, playlistDescription) {
    let userid;
    let playlistsObject;
    
    //API call to retrieve current user data///////////////////////////////////////////////////////////
    $.ajax({
        url: `https://api.spotify.com/v1/me`,
        type: 'GET',
        async: false,
        headers: {
            'Authorization' : 'Bearer ' + accessToken
        },
        success: function(data) {
          //Set call response to local variable
          userid = data.id;



          //API call to retrieve current user playlist data/////////////////////////////////////////////
          $.ajax({
            url: 'https://api.spotify.com/v1/me/playlists',
            type: 'GET',
            async: false,
            headers: {
                'Authorization' : 'Bearer ' + accessToken
            },
            success: function(data){
              //Set call response to local variable
              playlistsObject = data;

              //Loop to iterate through each playlist made by the user
              for(var i = 0; i < playlistsObject.items.length; i++){

                //Logic to find any playlist previously made by the application
                if(playlistsObject.items[i].name == playlistName){
                  let playlistID = playlistsObject.items[i].id;



                  //API call to DELETE the old playlist/////////////////////////////////////////////////
                  $.ajax({url: `https://api.spotify.com/v1/playlists/${playlistID}/followers`,
                    type: 'DELETE',
                    async: false,
                    headers: {
                        'Authorization' : 'Bearer ' + accessToken
                    },
                  });
                  

                }
              }



              //API call to create the new playlist////////////////////////////////////////////////////////
              $.ajax({
              url: `https://api.spotify.com/v1/users/${userid}/playlists`,
              type: 'POST',
              async: false,
              headers: {
                  'Authorization': 'Bearer ' + accessToken
              },
              data: JSON.stringify({
                'name': playlistName,
                'description': playlistDescription,
                'public': true
              }),
              success: function(data){
                
                //Set playlist ID to global variable for later use
                playlistIDNum = data.id;

              }
              })
              

            }
          })
        }
      })
    
    
    
    
  }


/*This method adds music to the given playlist with the playlist ID and
   song URI (Only adds one song at a time)*/
  let addSong = function(accessToken, playlistIDNum, uri){

    //API call to add a chosen song to the application playlist
    $.ajax({
      url: `https://api.spotify.com/v1/playlists/${playlistIDNum}/tracks?uris=${uri}`,
      type: 'POST',
      headers: {
          'Authorization': 'Bearer ' + accessToken,
          'Content-Type': 'application/json'
      },
      success: function(data){
        console.log(data);
      },
      error: function(data){
        console.log(data);
      }
    })
  }