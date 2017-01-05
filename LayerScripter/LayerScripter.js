// Github:   
// By:       
// Contact:  

var globalconfig = globalconfig || undefined;
var LayerScripter = LayerScripter || (function () {
    'use strict';

    let Version = 0.1;

    var ChatHandler = function () {
        log('ChatHandler');
    };

    var CheckInstaller = function () {
        log('CheckInstaller');
    };

    var EventHandlers = function () {
        on('chat:message', ChatHandler);
    };

    return {
        CheckInstalled: CheckInstaller,
        RegisterEventHandlers: EventHandlers
    };

});

on('ready', function () {
    'use strict';

    LayerScripter.CheckInstalled();
    LayerScripter.RegisterEventHandlers();
});