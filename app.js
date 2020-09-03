const input = document.getElementById('image');
const output = document.getElementById('output');
const details = document.getElementById('details');

input.addEventListener('change', function(){
    console.log('FILES', this.files);
    processImages(Array.from(this.files));
});

function processImages(images){
    Promise.all(images.map(file => {
        return getExifData(file);
    })).then(data => {
        data.forEach(file => displayData(file))
    });
}

function generateDetails(filedata){
    let message = `<strong>${filedata.name}</strong>`;
    let {DateTime} = filedata;
    if(DateTime){
        message += `: taken on ${parseDate(DateTime).toDateString()}`;
    }
    let {lat, long} = getGPSData(filedata);
    if(lat && long){
        message += ` at <a href="http://www.google.com/maps/place/${lat},${long}" target="_blank">${lat}, ${long}</a>`;
    }
    return message;
}

function displayData(fileinfo){
    const pre = document.createElement('pre');
    const detail = document.createElement('p');
    detail.innerHTML = generateDetails(fileinfo);
    pre.style.backgroundColor = "#ddd";
    pre.innerHTML = JSON.stringify(fileinfo, null, 4);
    output.appendChild(detail);
    output.appendChild(pre);
}

function getExifData(file){
    return new Promise((resolve, reject) => {
        EXIF.getData(file, function(){
            let all = EXIF.getAllTags(this);
            console.log('EXIF DATA', all);
            delete all.MakerNote;
            all.name = file.name;
            resolve(all);
        })
    })
}

function parseDate(s) {
    var b = s.split(/\D/);
    return new Date(b[0],b[1]-1,b[2],b[3],b[4],b[5]);
}

function getGPSData(allExif){
    let {GPSLatitude, GPSLatitudeRef, GPSLongitudeRef, GPSLongitude} = allExif;
    let lat, long;
    if(GPSLongitude && GPSLatitude){
        let longitude = {
            degrees: GPSLongitude[0],
            minutes: GPSLongitude[1],
            seconds: GPSLongitude[2],
            direction: GPSLongitudeRef
        };
        let latitude = {
            degrees: GPSLatitude[0],
            minutes: GPSLatitude[1],
            seconds: GPSLatitude[2],
            direction: GPSLatitudeRef
        };

        lat = ConvertDMStoDD(latitude.degrees, latitude.minutes, latitude.seconds, latitude.direction);
        long = ConvertDMStoDD(longitude.degrees, longitude.minutes, longitude.seconds, longitude.direction);
    }
    return {lat, long};
}

function ConvertDMStoDD(degrees, minutes, seconds, direction) {
    let dd = degrees + (minutes/60) + (seconds/3600);
    if(direction == "S" || direction == "W"){
        dd = dd * -1;
    }
    return dd;
}