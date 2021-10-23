let last_decoded_file;
let last_generated_pdf;

function textToCode(text) {
    let htmlElement = document.createElement('div');
    let qrcode = new QRCode(htmlElement, {
        width : 200,
        height : 200
    });

    qrcode.makeCode(text);

    return htmlElement.getElementsByTagName("canvas")[0];
}

function textToPDF(lines) {
    const doc = new jspdf.jsPDF({
        unit: "mm",
        format: 'a4'
    });
    const HALF_HEIGHT = 297/2;
    const QUARTER_HEIGHT = 297/4;
    const HALF_WIDTH = 210/2;


    for (let i = 0; i < lines.length; i++) {
        let [name, class_str] = lines[i];
        let [lastname, firstname] = splitNames(name);

        doc.setFontSize(30);
        let splitLastName = doc.splitTextToSize(lastname, 210 - (HALF_WIDTH + 20) - 10);

        doc.text(splitLastName, HALF_WIDTH + 20, QUARTER_HEIGHT - 15 - (splitLastName.length > 1 ? 11 : 0) + HALF_HEIGHT * (i%2));
        doc.text(firstname, HALF_WIDTH + 20, QUARTER_HEIGHT + HALF_HEIGHT * (i%2));
        doc.text(class_str, HALF_WIDTH + 20, QUARTER_HEIGHT + 15 + HALF_HEIGHT * (i%2));

        let qr_code_canvas = textToCode(lines[i].join(";"));

        doc.addImage(qr_code_canvas, 'JPEG', 20, QUARTER_HEIGHT - 35 + HALF_HEIGHT * (i%2), 70, 70, '', 'MEDIUM', 0);

        if (i%2 == 1 && i < lines.length - 1)
            doc.addPage('a4', 'portrait');
    }
    last_generated_pdf = doc;
}

function setSampleData(name, class_str, birthdate, gender) {
    document.getElementById("sample_name").innerText = name;
    document.getElementById("sample_class").innerText = class_str;
    document.getElementById("sample_birthdate").innerText = birthdate;
    document.getElementById("sample_gender").innerText = gender;
}

function isUpperCase(str) {
    return str === str.toUpperCase();
}

function splitNames(fullname) {
    let names = fullname.split(' ');
    let lastname = names.filter(isUpperCase).join(' ');
    let firstname = names.filter(name => !isUpperCase(name)).join(' ');

    return [lastname, firstname];
}

function readCSVFile(file) {
    console.log(file);
    let drop_zone_text = document.getElementById("drop_zone_text");
    let save_pdf_button = document.getElementById("save_pdf_button");
    drop_zone_text.innerText = "Génération des dossards en cours...";

    let reader = new FileReader();
    reader.onload = function(event) {
        decoded_file = reader.result;

        if (decoded_file.indexOf('�') != -1) {
            let reader = new FileReader();
            reader.onload = function(event) {
                let decoded_file = decode(reader.result, {
                    mode: 'fatal'
                });
                last_decoded_file = decoded_file;
                processCSVFile(decoded_file);
                drop_zone_text.innerText = "Importer une nouvelle liste";
                save_pdf_button.removeAttribute("disabled");
            };
            reader.readAsBinaryString(file);
        } else {
            last_decoded_file = decoded_file;
            processCSVFile(decoded_file);
            drop_zone_text.innerText = "Importer une nouvelle liste";
            save_pdf_button.removeAttribute("disabled");
        }
    };

    reader.readAsText(file);
}

function detectSeparator(str) {
    let max_occurrences = 0;
    let separators = ['\t', ',', ';'];
    let best_separator = separators[0];

    for (let separator of separators) {
        let occurences =  str.split(separator).length - 1;

        if (occurences > max_occurrences) {
            max_occurrences = occurences;
            best_separator = separator;
        }
    }

    return best_separator;
}

function processCSVFile(decoded_file) {
    let has_header = document.getElementById("has_header").checked;

    let separator = detectSeparator(decoded_file);
    let lines = decoded_file.split(/\r\n?/);

    if (has_header) {
        lines = lines.slice(1);
    }

    let cells = lines.filter(l => l.length).map(l => l.replaceAll("\"", "").split(separator).splice(0, 4));

    if (cells.length > 0) {
        setSampleData(cells[0][0], cells[0][1], cells[0][2], cells[0][3]);
    }

    textToPDF(cells);
}

function dropHandler(ev) {
    console.log('File(s) dropped');

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();

    if (ev.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (let i = 0; i < ev.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (ev.dataTransfer.items[i].kind === 'file') {
                readCSVFile(ev.dataTransfer.items[i].getAsFile());
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        for (let i = 0; i < ev.dataTransfer.files.length; i++) {
            readCSVFile(ev.dataTransfer.files[i]);
        }
    }
}

function dragOverHandler(ev) {
    console.log('File(s) in drop zone');

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
}

function onDropZoneClick() {
    document.getElementById('file_input').click();
}

function fileUploadHandler(event) {
    for (let i = 0; i < event.target.files.length; i++) {
        readCSVFile(event.target.files[i]);
    }
}

function hasHeaderChanged() {
    processCSVFile(last_decoded_file);
}

function savePDF() {
    if (last_generated_pdf) {
        last_generated_pdf.save("Dossards.pdf");
    }
}