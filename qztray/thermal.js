/* 
 * ***************************************************************
 * Script : kasir.js 
 * Version : 1.0.0
 * Date : Mar 18, 2018 / 3:33:02 PM
 * Author : Pudyasto
 * Email : mr.pudyasto@gmail.com
 * Description : 
 * ***************************************************************
 */
$(document).ready(function () {
    window.readingWeight = false;
    generate_certificate();
    startConnection();
});

function generate_certificate() {
    qz.security.setCertificatePromise(function (resolve, reject) {
        $.ajax('qztray/override.crt').then(resolve, reject);
    });
    qz.security.setSignatureAlgorithm("SHA512"); // Since 2.1
    qz.security.setSignaturePromise(function (toSign) {
        return function (resolve, reject) {
            fetch("sign.php?param=" + toSign, {cache: 'no-store', headers: {'Content-Type': 'text/plain'}})
             .then(function(data) { data.ok ? resolve(data.text()) : reject(data.text()); });
            // $.get('sign.php', { param: toSign }).then(resolve, reject);
        };
    });
}

function startConnection(config) {
    if (!qz.websocket.isActive()) {
        console.log('QZ Aktif');
        qz.websocket.connect(config).then(function () {
            updateState('QZ Aktif');
            findDefaultPrinter(true);
        }).catch(handleConnectionError);
    } else {
        console.log('An active connection with QZ already exists.');
        displayMessage('An active connection with QZ already exists.', 'alert-warning');
    }
}

function updateState(text) {
    qz.api.getVersion().then(function (data) {
        console.log('Verison ' + data);
        $("#qz-version").html(text + ' Ver. ' + data);
    }).catch(displayError);
}

function findPrinters() {
    qz.printers.find().then(function(data) {
        var list = '';
        var btn = '';
        for(var i = 0; i < data.length; i++) {
            list += "&nbsp; " + data[i] + "&nbsp;" + "<br/>";
            btn+="<button>" + data[i] + "</button>";
        }
        $('#print-list').html(btn);
        $('#show-list').html("<strong>Available printers:</strong><br/>" + list);
    }).catch(displayError);
}

function detailPrinters() {
    qz.printers.details().then(function(data) {
        var list = '';
        for(var i = 0; i < data.length; i++) {
            list += "<li>" + (data[i].default ? "* " : "") + data[i].name + "<ul>" +
                "<li><strong>Driver:</strong> " + data[i].driver + "</li>" +
                "<li><strong>Density:</strong> " + data[i].density + "dpi</li>" +
                "<li><strong>Connection:</strong> " + data[i].connection + "</li>" +
                (data[i].trays ? "<li><strong>Trays:</strong> " + data[i].trays + "</li>" : "") +
                accumulateSizes(data[i]) +
                "</ul></li>";
        }

        $('#show-list').html("<strong>Printer details:</strong><br/><ul>" + list + "</ul>");
    }).catch(displayError);
}



function accumulateSizes(data) {
    var html = "";
    if(data.sizes) {
        var html = "<li><details><summary><strong><u>Sizes:</u></strong> (" + data.sizes.length + ")</summary> ";
        var sizes = data.sizes;
        html += "<ul>";
        for(var i = 0; i < sizes.length; i++) {
            html += "<li><details><summary><u>" + sizes[i].name + "</u></summary><ul>";

            var inch = sizes[i].in.width + " x " + sizes[i].in.height;
            var mill = sizes[i].mm.width + " x " + sizes[i].mm.height;

            var inchTrunc = truncate(sizes[i].in.width, 3) + "&nbsp;x&nbsp;" + truncate(sizes[i].in.height, 3);
            var millTrunc = truncate(sizes[i].mm.width, 3) + "&nbsp;x&nbsp;" + truncate(sizes[i].mm.height, 3);

            html += "<li style='text-overflow: ellipsis;' title='" + inch + "'><strong>in:</strong>&nbsp;" + inchTrunc + "</li>";
            html += "<li style='text-overflow: ellipsis;' title='" + mill + "'><strong>mm:</strong>&nbsp;" + millTrunc + "</li>";

            html += "</ul></details></li>";
        }
        html += "</ul></details></li>";
    }
    return html;
}


function truncate(val, length, ellipsis) {
    var truncated;
    if(isNaN(val)) {
        truncated = val.substring(0, length);
    } else {
        var mult = Math.pow(10, length);
        truncated = Math.floor(val * mult) / mult;
    }
    if(ellipsis === false) {
        return truncated;
    }
    return val === truncated ? val : truncated + "&hellip;";
}


function findDefaultPrinter(set) {
    generate_certificate();
    if (localStorage.printername) {
        setPrinter(localStorage.printername);
        $("#qz-printer").html('<button type="button" onclick="resetPrinter();" class="btn btn-outline-success">Reset Printer : ' + localStorage.printername + '</button>');
    } else {
        console.log('Set Printer');
        qz.printers.getDefault().then(function (data) {
            console.log(data);
            displayMessage(data);
            localStorage.setItem("printername", data);
            if (set) {
                setPrinter(data);
            }
        }).catch(displayError);
    }
}

function resetPrinter() {
    localStorage.removeItem("printername");
    location.reload();
}

function setPrinter(printer) {
    var cf = getUpdatedConfig();
    cf.setPrinter(printer);
    $("#qz-printer").html('<button type="button" onclick="resetPrinter();" class="btn btn-outline-success">Reset Printer : ' + printer + '</button>');
}

function listNetworkDevices() {
    var listItems = function(obj) {
        var html = '';
        var labels = { mac: 'MAC', ip: 'IP', up: 'Up', ip4: 'IPv4', ip6: 'IPv6', primary: 'Primary' };

        Object.keys(labels).forEach(function(key) {
            if (!obj.hasOwnProperty(key)) { return; }
            if (key !== 'ip' && obj[key] == obj['ip']) { return; }

            var value = obj[key];
            if (key === 'mac') { value = obj[key].match(/.{1,2}/g).join(':'); }
            if (typeof obj[key] === 'object') { value = value.join(', '); }

            html += '<li><strong>' + labels[key] + ':</strong> <code>' + value + '</code></li>';
        });

        return html;
    };

    qz.networking.devices().then(function(data) {
        var list = '';

        for(var i = 0; i < data.length; i++) {
            var info = data[i];

            if (i == 0) {
                list += "<li>" +
                    "   <strong>Hostname:</strong> <code>" + info.hostname + "</code>" +
                    "</li>" +
                    "<li>" +
                    "   <strong>Username:</strong> <code>" + info.username + "</code>" +
                    "</li>";
            }
            list += "<li>" +
                "   <strong>Interface:</strong> <code>" + (info.name || "UNKNOWN") + (info.id ? "</code> (<code>" + info.id + "</code>)" : "</code>") +
                "   <ul>" + listItems(info) + "</ul>" +
                "</li>";
        }
        $('#show-list').html("<strong>Network details:</strong><ul>" + list + "</ul>");
    }).catch(displayError);
}

function printAdmisi(obj) {
    var config = getUpdatedConfig(1, "Cetak Tiket Antrian");       // Exact printer name from OS
    var data = [
        '\x1B' + '\x40', // init
        '\x1B' + '\x61' + '\x31', // center align
        '\x1B' + '\x45' + '\x0D', // bold on
        paper_header + '\x0A',
        '\x1B' + '\x45' + '\x0A', // bold off
        tgl_id_short(obj.antrian.tanggal_daftar) + '\x0A',
        '------------------------------------------------\x0A',
        '\x1D' + '\x21' + '\x11', // double font size
        obj.antrian.nomor_tiket + '\x0A',
        '\x1D' + '\x21' + '\x00', // standard font size
        '------------------------------------------------\x0A',
        'POLI : ' + obj.jadwal.namapoli + '\x0A',
        obj.dokter.nama + '\x0A',
        '(' + obj.jadwal.nama_sesi + ') - ' + obj.jadwal.jam_praktek + '\x0A',
        '\x1B' + '\x45' + '\x0D', // bold on
        "URUTAN POLI " + obj.antrian.urut_dokter + '\x0A',
        '\x1B' + '\x45' + '\x0A', // bold off
        '------------------------------------------------\x0A',
        paper_footer + '\x0A',
        '\x0A' + '\x0A' + '\x0A' + '\x0A' + '\x0A' + '\x0A' +
        '\x1B' + '\x69'
    ];
    qz.print(config, data).then(function () {
        $(".btn").attr("disabled", false);
    }).catch(function (e) {
        toastbs(e, "Kesalahan", "error");
        $(".btn").attr("disabled", false);
    });
}

var cfg = null;
function getUpdatedConfig(copy = 1, job = "Print") {
    if (cfg == null) {
        cfg = qz.configs.create(null);
    }
    cfg.reconfigure({
        copies: copy,
        jobName: job
    });
    return cfg
}

function handleConnectionError(err) {
    //updateState('Error', 'danger');

    if (err.target != undefined) {
        if (err.target.readyState >= 2) { //if CLOSING or CLOSED
            displayError("Connection to QZ Tray was closed");
        } else {
            displayError("A connection error occurred, check log for details");
            console.error(err);
        }
    } else {
        displayError(err);
    }
}

function displayMessage(msg, css) {
    console.log(msg);
}

function displayError(err) {
    console.log(err);
    // displayMessage(err, 'alert-danger');
}