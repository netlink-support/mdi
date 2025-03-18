var mdi = {    
    ajax_url: base_url + '/ajax/',
    showBrochurePop: function (item) {
        var program_id = $(item).data('program-id');
        var modal_id = $(item).data('modal-id');
        $('#program_id').val(program_id);
        $('#program_id1').val(program_id);
        $("#" + modal_id).modal("show"); 
    },
    showEnquiryPop: function (item) {
        var program_id = $(item).data('program-id');
        var modal_id = $(item).data('modal-id');
        $('#program_id_inquiry').val(program_id);
        $("#" + modal_id).modal("show");
    }
}
