const client_id = '2c975b81a88e4032b505b89b41320195';
const client_secret = 'c145d961cdd848c8a4e208b69a986e54';
const redirect_uri = encodeURI('http://localhost:3000/')

const errorMessage = (error) => {
    console.error(error)
}

const getToken = async () => {
    const result = await fetch('https://accounts.spotify.com/api/token', {
       method: 'POST',
       headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(client_id + ':' + client_secret)
       },
       body: `grant_type=client_credentials&code=${getLoginCode()}`
    });
 
    const data = await result.json();
    console.log(data.access_token)
    return data.access_token;
 }

const fetchTemplate = async (url, method='GET') => {
    let token = await getToken();
    const result = await fetch(`https://api.spotify.com/v1/` + url, {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    })
    if (result.ok) {
        const data = await result.json();
        return data
    } else {
        if (result.status === 404) {
            throw new Error("There's no data. Try to reload page.")
        } else {
            if (result.status === 401) {
                throw new Error("Bad or expired token. This can happen if the user revoked a token or the access token has expired. You should re-authenticate the user.")
            } else {
                if (result.status === 403) {
                    throw new Error("Bad OAuth request (wrong consumer key, bad nonce, expired timestamp...). Unfortunately, re-authenticating the user won't help here.")
                } else {
                    throw new Error("Something went wrong")
                }
            }
        }
    }
}

const getTracks = async (q) => {
    try {
        const url = `search?q=${q}&type=track`;
  
        let data = await fetchTemplate(url);
        return data.tracks;
     }
  
     catch (e) {
        errorMessage(e);
     }
}

const getLiked = async(ids) => {
     try {
        const url = `me/tracks/contains?ids=${ids.toString()}`;
  
        let data = await fetchTemplate(url);
        return data.tracks;
     }
  
     catch (e) {
        errorMessage(e);
     }
}

const getTrackRecord = (item) => 
{
    let track_record = document.createElement("li")
    track_record.classList.add('spoty_record')
    const rec_date = new Date(item.album.release_date)
    const track_len = new Date(item.duration_ms)

    const inner = `
        <div class="record_body"> 
            <div class="track_img">
                <img src="${item.album.images[0].url}">
            </div>
            <div>
                <a href=${item.external_urls.spotify}>
                    <span>
                        ${item.name}
                    </span>
                </a>
                <div class="track_artists text_truncate">
                    ${item.artists.map((elem) => {
                        return `
                        <a href="${elem.external_urls.spotify}">
                            ${elem.name}
                        </a>
                        `
                    })}
                </div>
            </div>
            <a href="${item.album.external_urls.spotify}">
                ${item.album.name}
            </a>
            <div>
                ${rec_date.toLocaleDateString("ru")}
            </div>
            <div class="like_btn">
                <img src="/heart.png">
            </div>
            <div>
                ${track_len.getMinutes()}:${track_len.getSeconds().toString().padStart(2,'0')}
            </div>

         </div>
    `
    track_record.innerHTML = inner

    return track_record
}


document.querySelector('.search_btn').addEventListener('click', async (e) => {

    const query = document.getElementsByClassName('search_inp')[0].value
    let ans = await getTracks(query)

    const container = document.getElementsByClassName('spoty_tarclist')[0]
    container.innerHTML = ''
    const liked = await getLiked(ans.items[0].id)

    console.log(liked)

    for (item of ans.items){
        let record = getTrackRecord(item)
        container.insertAdjacentElement('beforeend', record)
        // console.log(item.id)
    }

})

var log_link = document.querySelector('.spoty_login')
log_link.href = `https://accounts.spotify.com/authorize?
client_id=${client_id}
&response_type=code&
redirect_uri=${encodeURI('http://localhost:3000/')}&
show_dialog=true&
scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private user-library-modify`


const getLoginCode = () => {
    var url_string = window.location.href;
    var url = new URL(url_string);
    var paramValue = url.searchParams.get("code");
    return paramValue
 }