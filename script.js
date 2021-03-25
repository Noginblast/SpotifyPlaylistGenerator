// Document has been loaded
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

    // AUTHORIZE with Spotify (if needed)
    // *************** REPLACE THESE VALUES! *************************
    let client_id = 'e8714888680a477cb0afc745df9c8030';
    // Use the following site to convert your regular url to the encoded version:
    // https://www.url-encode-decode.com/
    let redirect_uri = 'https%3A%2F%2Fnoginblast.github.io%2FSpotifyPlaylistGenerator%2F'; // https%3A%2F%2Fnoginblast.github.io%2FSpotifyPlaylistGenerator%2F  http%3A%2F%2F127.0.0.1%3A5500%2F
    // *************** END *************************

    const redirect = `https://accounts.spotify.com/authorize?client_id=${client_id}&response_type=token&redirect_uri=${redirect_uri}&scope=playlist-modify-private`;
    // Don't authorize if we have an access token already
    if(accessToken == null || accessToken == "" || accessToken == undefined){
      window.location.replace(redirect);
    }

    // Search button has been clicked
    $( "#search_button" ).click(function() {
      //Get the value of the search box
      let raw_search_query = $('#search-text').val();
      let search_query = encodeURI(raw_search_query);
      
      createPlaylist(accessToken);
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



  let createPlaylist = function(accessToken) {
    let userid;
    let playlistsObject;
    let playlistExists = false;
    
    
    $.ajax({
        url: `https://api.spotify.com/v1/me`,
        type: 'GET',
        headers: {
            'Authorization' : 'Bearer ' + accessToken
        },
        success: function(data) {
          userid = data.id;

          $.ajax({
            url: 'https://api.spotify.com/v1/me/playlists',
            type: 'GET',
            headers: {
                'Authorization' : 'Bearer ' + accessToken
            },
            success: function(data){
              playlistsObject = data;
            }
          })
    
        for(const item in playlistsObject){
            if(JSON.stringify(playlistsObject.items[item].name) == "Test Playlist"){
              playlistExists = true;


            }
            
            console.log(playlistsObject.items[items].name);
        }

        

        if(!playlistExists){
          $.ajax({
          url: `https://api.spotify.com/v1/users/${userid}/playlists`,
          type: 'POST',
          headers: {
              'Authorization': 'Bearer ' + accessToken
          },
          data: JSON.stringify({
            'name': 'Test Playlist',
            'description': 'THIS IS A TEST',
            'public': false
            })
          })
        }
          
        }
      })
    
    
    
    
  }