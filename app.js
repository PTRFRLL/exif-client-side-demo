const input = document.getElementById('image');
const output = document.getElementById('output');

input.addEventListener('change', function(){
    console.log('FILES', this.files);
    processImages(Array.from(this.files));
});

/**
 * Get exif data for all supplied image files
 * @param {array} images 
 */
function processImages(images){
    Promise.all(images.map(async file => {
        let exif = await getExifData(file);
        let data = await generateBase64Img(file);
        return {
            exif, data
        }
    })).then(data => {
        data.forEach(file => displayData(file))
    });
}

/**
 * Generate base64 string of image
 * @param {*} file 
 */
function generateBase64Img(file){
    return new Promise((resolve, reject) => {
        let reader = new FileReader();
        reader.onloadend = function(e){
            resolve(this.result);
        };
        reader.readAsDataURL(file);
    })
}

/**
 * Generate formatted details (date, GPS) for image
 * @param {any} filedata 
 */
function generateDetails(filedata){
    let message = `<strong>${filedata.name}</strong>`;
    let {DateTime} = filedata;
    if(DateTime){
        message += `<br />${parseDate(DateTime).toDateString()}`;
    }
    let {lat, long} = getGPSData(filedata);
    if(lat && long){
        message += `<br /><a href="http://www.google.com/maps/place/${lat},${long}" target="_blank">${lat}, ${long}</a>`;
    }
    return message;
}

/**
 * Add exif data to html
 * @param {any} fileinfo 
 */
function displayData(fileinfo){
    const outer = document.createElement('div');
    outer.classList.add('outer');
    const div = document.createElement('div');
    div.classList.add('container');
    const pre = document.createElement('pre');
    const detail = document.createElement('p');
    const image = document.createElement('img');
    image.src = fileinfo.data;
    detail.innerHTML = generateDetails(fileinfo.exif);
    pre.classList.add('exif');
    pre.innerHTML = JSON.stringify(fileinfo.exif, null, 4);
    outer.appendChild(detail);
    div.appendChild(image);
    div.appendChild(pre);
    outer.appendChild(div);
    output.appendChild(outer);
}

/**
 * Get image EXIF data using exif-js
 * @param {*} file 
 */
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

/**
 * Convert EXIF datestring into js date
 * @param {string} dateString 
 */
function parseDate(date) {
    var b = date.split(/\D/);
    return new Date(b[0],b[1]-1,b[2],b[3],b[4],b[5]);
}

/**
 * Convert EXIF GPS data into lat,long
 * @param {any} allExif 
 */
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

/**
 * Conver GPS in d/m/s into decimal coordinates
 * @param {number} degrees 
 * @param {number} minutes 
 * @param {number} seconds 
 * @param {string} direction 
 */
function ConvertDMStoDD(degrees, minutes, seconds, direction) {
    let dd = degrees + (minutes/60) + (seconds/3600);
    if(direction == "S" || direction == "W"){
        dd = dd * -1;
    }
    return dd;
}