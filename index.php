
<button type="button" id="list_network" name="list_network">
    List Network
</button>
<button type="button" id="list_printer" name="list_printer">
    List Printer
</button>
<button type="button" id="list_detail_printer" name="list_detail_printer">
    Detail List Printer
</button>
<button type="button" id="btn_find_print" name="btn_find_print">
    Find Printer
</button>
<span id="qz-printer"></span>

<div>
    Ver . <span id="qz-version"></span>
</div>


<div id="print-list"></div>

<div id="show-list"></div>

<script src="https://code.jquery.com/jquery-3.7.1.js" integrity="sha256-eKhayi8LEQwp4NKxN+CfCh+3qOVUtJn3QNZ0TciWLP4=" crossorigin="anonymous"></script>
<script src="qztray/dependencies/rsvp-3.1.0.min.js" type="text/javascript"></script>
<script src="qztray/dependencies/sha-256.min.js" type="text/javascript"></script>
<script src="qztray/qz-tray.js" type="text/javascript"></script>
<script src="qztray/thermal.js" type="text/javascript"></script>

<script>
    $(function() {
        $("#btn_find_print").on('click', function() {
            resetPrinter();
        });
        $("#list_printer").on('click', function() {
            findPrinters();
        });
        $("#list_detail_printer").on('click', function() {
            detailPrinters();
        });
        $("#list_network").on('click', function() {
            listNetworkDevices();
        });
    });
</script>