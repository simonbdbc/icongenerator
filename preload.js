const fs = require('fs');
const {
    dialog
} = require('electron').remote;


// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
window.addEventListener('DOMContentLoaded', () => {

    let iconFile;
    let cropper;
    var croppable = false;
    var x;
    var y;

    const fileTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png'
    ]

    const validFileType = function (file) {
        for (var i = 0; i < fileTypes.length; i++) {
            if (file.type === fileTypes[i]) {
                return true;
            }
        }
        return false;
    }

    const openAttach = function () {
        while (preview.firstChild) {
            preview.removeChild(preview.firstChild);
        }
        let curFiles = input.files;
        if (curFiles.length === 0) {
            let para = document.createElement('p');
            para.textContent = "Aucune image n'a été selectionnée";
            preview.appendChild(para);
        } else {
            let frag = document.createDocumentFragment();
            if (validFileType(curFiles[0])) {
                let image = document.createElement('img');
                image.id = 'icon_image';
                image.src = window.URL.createObjectURL(curFiles[0]);
                image.style.maxWidth = '100%';
                image.style.maxHeight = '100%';
                frag.appendChild(image);
                iconFile = curFiles[0];
            } else {
                let para = document.createElement('p');
                para.textContent = 'File name ' + curFiles[0].name + ': Not a valid file type. Update your selection.';
                frag.appendChild(para);
            }
            preview.appendChild(frag);
        }


        const image = document.getElementById('icon_image');
        cropper = new Cropper(image, {
            aspectRatio: 1,
            viewMode: 1,
            ready: function () {
                croppable = true;
            },
            crop(event) {
                document.getElementById('dim_resolution').value = event.detail.zoom
                document.getElementById('dim_hauteur').value = event.detail.height
                document.getElementById('dim_largeur').value = event.detail.width
                x = event.detail.x
                y = event.detail.y
            },
        });
    }

    const saveImage = function () {

        if (iconFile) {
            let path = iconFile.path;
            let name = iconFile.name;
            let options = {
                title: "Enregistrer l'image",
                defaultPath: name,
                buttonLabel: "Enregistrer",
                properties: ['openFile', 'openDirectory'],
                filters: [{
                        name: 'Images',
                        extensions: ['jpg', 'png', 'gif', 'jpeg']
                    },
                    {
                        name: 'All Files',
                        extensions: ['*']
                    }
                ]
            }

            var croppedCanvas;
            var roundedCanvas;
            var roundedImage;
            if (!croppable) {
                return;
            }

            croppedCanvas = cropper.getCroppedCanvas();
            if (document.getElementById('angle_rond').checked == true) {
                roundedCanvas = getRoundedCanvas(croppedCanvas);
                croppedCanvas = roundedCanvas;
            // } else if (document.getElementById('angle_arrondi').checked == true) {
            //     roundedCanvas = getAroundedCanvas(croppedCanvas, x, y);
            //     croppedCanvas = roundedCanvas;
            }
            // debugger

            dialog.showSaveDialog(options, (filename) => {

                croppedCanvas.toBlob((blob) => {
                    var reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = function () {
                        var result = reader.result;
                        var base64Data = result.replace(/^data:image\/png;base64,/, "");
                        fs.writeFile(filename, base64Data, 'base64', function (err) {
                            if (err) throw err;
                        });
                    }
                })

            })
        }
    }

    // function getAroundedCanvas(sourceCanvas, x, y) {
    //     var canvas = document.createElement('canvas');
    //     var context = canvas.getContext('2d');
    //     var width = sourceCanvas.width;
    //     var height = sourceCanvas.height;
    //     var radius = 20;
    //     canvas.width = width;
    //     canvas.height = height;
    //     context.imageSmoothingEnabled = true;
    //     context.drawImage(sourceCanvas, 0, 0, width, height);
    //     context.globalCompositeOperation = 'destination-in';
    //     context.beginPath();
    //     context.moveTo(x + radius, y);
    //     context.lineTo(x + width - radius, y);
    //     context.quadraticCurveTo(x + width, y, x + width, y + radius);
    //     context.lineTo(x + width, y + height - radius);
    //     context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    //     context.lineTo(x + radius, y + height);
    //     context.quadraticCurveTo(x, y + height, x, y + height - radius);
    //     context.lineTo(x, y + radius);
    //     context.quadraticCurveTo(x, y, x + radius, y);
    //     context.fill();
    //     return canvas;
    // }

    function getRoundedCanvas(sourceCanvas) {
        var canvas = document.createElement('canvas');
        var context = canvas.getContext('2d');
        var width = sourceCanvas.width;
        var height = sourceCanvas.height;
        canvas.width = width;
        canvas.height = height;
        context.imageSmoothingEnabled = true;
        context.drawImage(sourceCanvas, 0, 0, width, height);
        context.globalCompositeOperation = 'destination-in';
        context.beginPath();
        context.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, 2 * Math.PI, true);
        context.fill();
        return canvas;
    }

    var angleDroit = document.getElementById('angle_droit');
    var angleArrondi = document.getElementById('angle_arrondi');
    var angleRond = document.getElementById('angle_rond');

    angleDroit.addEventListener('click', function (e) {
        document.querySelector('.cropper-view-box').style.borderRadius = '0';
        document.querySelector('.cropper-face').style.borderRadius = '0';
    });
    angleArrondi.addEventListener('click', function (e) {
        document.querySelector('.cropper-view-box').style.borderRadius = '20%';
        document.querySelector('.cropper-face').style.borderRadius = '20%';
    });
    angleRond.addEventListener('click', function (e) {
        document.querySelector('.cropper-view-box').style.borderRadius = '50%';
        document.querySelector('.cropper-face').style.borderRadius = '50%';
    });


    let input = document.getElementById('image_uploads')
    input.style.opacity = 0
    input.style.position = 'absolute'
    input.style.top = 0
    input.style.right = 0
    input.addEventListener('change', openAttach)

    let preview = document.getElementById('icon_preview');

    document.getElementById('save_image').addEventListener('click', saveImage);

})