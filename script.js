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
        'url': "/blob/main/artistInfo.json",
        'dataType': "json",
        'success': function(data) {
          artistLoc = data;
        }
      });
      return artistLoc;
    })();

    console.log(artistLoc);


  


    // AUTHORIZE with Spotify (if needed)
    // *************** REPLACE THESE VALUES! *************************
    let client_id = 'e8714888680a477cb0afc745df9c8030';
    // Use the following site to convert your regular url to the encoded version:
    // https://www.url-encode-decode.com/
    let redirect_uri = 'https%3A%2F%2Fnoginblast.github.io%2FSpotifyPlaylistGenerator%2F'; // https%3A%2F%2Fnoginblast.github.io%2FSpotifyPlaylistGenerator%2F  http%3A%2F%2F127.0.0.1%3A5500%2F
    // *************** END *************************

    const redirect = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=token&redirect_uri=${redirect_uri}&scope=playlist-modify-private%20playlist-modify-public`;
    // Don't authorize if we have an access token already
    if(accessToken == null || accessToken == "" || accessToken == undefined){
      window.location.replace(redirect);
    }

    // Search button has been clicked
    $( "#search_button" ).click(function() {
      //Get the value of the search box
      let raw_search_query = $('#stateSelector').val();
      let playlistDuration = parseInt($('#hourSelector').val())*3600 + (parseInt($('#minSelector').val()))*60;

      console.log(playlistDuration);
      let search_query = encodeURI(raw_search_query);

      let date = new Date();
      let playlistDescription = date.toString();

      let artistNameContainer = [];
      let artistIDContainer = [];

      loadArtists(artistLoc, raw_search_query, artistNameContainer);
      //console.log(artistNameContainer);
      
      
      createPlaylist(accessToken, playlistName, playlistDescription);

      addRandomSongs(accessToken,artistNameContainer,playlistDuration);

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
          //let uri = data.tracks.items[count].uri;

          //Add music to the appication playlist
          //addSong(accessToken, playlistIDNum, uri);


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
  let addRandomSongs = function(accessToken, artistNameContainer, duration){
    var durationCount = 0;
    var tmp;
    
    while(true){
      var randNum = Math.floor(Math.random()*playlistIDNum.length);
      var artID = artistNameContainer[randNum].id;

      if(durationCount > duration){
        break;
      }

      $.ajax({
        url: `https://api.spotify.com/v1/artists/${artID}/top-tracks?market=from_token`,
        type: 'GET',
        async: false,
        headers: {
            'Authorization': 'Bearer ' + accessToken,
        },
        success: function(data){
          var randNum2 = Math.floor(Math.random()*data.tracks.length);

          durationCount += Math.floor((data.tracks[randNum2].duration_ms)/1000);
          tmp = Math.floor((data.tracks[randNum2].duration_ms)/1000);

          if(durationCount < duration){
            $.ajax({
              url: `https://api.spotify.com/v1/playlists/${playlistIDNum}/tracks?uris=${data.tracks[randNum2].uri}`,
              type: 'POST',
              async: false,
              headers: {
                  'Authorization': 'Bearer ' + accessToken,
                  'Content-Type': 'application/json'
              },
              success: function(data){
                
              },
              error: function(data){
                
                durationCount = durationCount - tmp;
              }
            })
          }
        
          
          
          
        },
        error: function(data){
          
        }
      })

      

    }
  }

  let loadArtists = function(artistLoc, state, artistNameContainer){
      for(var i = 0; i < artistLoc.length; i++){
        if(artistLoc[i] != null){
          if(artistLoc[i].state == state){
          artistNameContainer.push(artistLoc[i]);
          }
        }
        
      }
  }

  let loadArtistIDs = function(accessToken,artistNameContainer,artistIDContainer){
      
    for(var i = 0; i < artistNameContainer.length; i++){
      var artistNameURI = encodeURI(artistNameContainer[i])
      $.ajax({
      url: `https://api.spotify.com/v1/search?q=${artistNameURI}&type=artist`,
      type: 'GET',
      async: false,
      headers: {
          'Authorization' : 'Bearer ' + accessToken
      },
      success: function(data){
        artistIDContainer.push(data.artists.items[0].id);
      },
      error: function(){

      }
      });
    }
  }

  let changeArtistIDs = function(accessToken,artistLoc){
      
    for(var i = 36000; i < artistLoc.length; i++){
      var artistNameURI = encodeURI(artistLoc[i].artist);
      $.ajax({
      url: `https://api.spotify.com/v1/search?q=${artistNameURI}&type=artist`,
      type: 'GET',
      async: false,
      headers: {
          'Authorization' : 'Bearer ' + accessToken
      },
      success: function(data){

        if(data.artists.items.length == 0){
          artistLoc[i].id = "";
        }
        else{
          artistLoc[i].id = data.artists.items[0].id;
        }
        
      },
      error: function(){

      }
      });
    }
  }

  let pruneJSON = function(artistLoc){
      for(var i = 0; i < artistLoc.length; i++){
        if(artistLoc[i] === null){
          delete artistLoc[i];
        }
      }
  }