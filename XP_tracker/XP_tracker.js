// Perloads the api
on("ready", function () {
    "use strict";

    if (!state.XP_Tracker) {
        state.XP_Tracker = {
            Version: '0.1',
            Config: {},
            PoolIDs: {},
        };
    };
    log("XP Tracker Version " + state.XP_Tracker.Version + " is now ready.");
});

SendChat = function (msg) {
    sendChat ('XP_tracker', msg)
}

ShowHelp = function () {
//TBD
}

// The function sends the list of characters in the XP pool to the campaign chat.
ViewPool = function () {
    var output = '/w gm <div>Members of the Pool<div><table border=\"1\">';

    list = GetPoolMembers();
    log(list);
    if (('undefined' !== typeof list) && (list !== '')) {

        list.forEach(function (elm) {
            output += '<td>' + GetCharName(elm) + '</td></tr>';
        });
        output += '</table></div>'
        SendChat(output);
    };
}

// The function returns a kust if character IDs stored in the state.XP_Tracker.PoolIDs.
GetPoolMembers = function () {
    if ('undefined' !== typeof state.XP_Tracker.PoolIDs) {
        return (Object.getOwnPropertyNames(state.XP_Tracker.PoolIDs));
    };
    return ('');
};

// The functions returns a array containing character IDs form only the current selected tokens that are non-npc characters.
GetTokenCharID = function (msg) {
    var CharID = [],
        i = 0;

    _.each(msg.selected, function (obj) {
        tempobj = findObjs({ _type: obj._type, id: obj._id });
        if (('undefined' !== typeof tempobj[0].attributes.represents) && (tempobj[0].attributes.represents !== "")) {
            if (getAttrByName(tempobj[0].attributes.represents, "is_npc", "current") == 0) {
                CharID[i++] = tempobj[0].attributes.represents;
            }
        };
    });
    return (CharID);
}

// Add selected tokens of non-npc characters tot he state.XP_Tracker.PoolIDs
AddTokentoXPPool = function (msg) {
    var CharID = GetTokenCharID(msg);
    log("AddTokentoXPPool:CharID: " + CharID);
    _.each(CharID, function (Id) {
        log("AddTokentoXPPool:ID: " + Id + " Name: " + GetCharName(Id));
        state.XP_Tracker.PoolIDs[Id] = GetCharName(Id);
    });
    log("AddTokentoXPPool:Object.getOwnPropertyNames(state.XP_Tracker.PoolIDs) : " + GetPoolMembers());
}

AddCharbyName = function (name) {

    var list = GetCharIDbyName(name);


    if (list.length == 0) {
        // There is no matching character
        return;
    }
    else {
        var output = '/w gm <div>The following characters have been found that match the name you submitted.  Please select the character(s) you wish to add.'
        list.forEach(function (elm) {
            output += '<div><a href="!XP_tracker --AddId ' + elm.id + '">' + GetCharName(elm.id) + '</a></div>';
        });
        output += '</div>'
        SendChat(output);
    }

    var characterId = list[0].id; // Assuming characters in the journal have unique names
    state.XP_Tracker.PoolIDs[id] = characterId;
    GetCharName(characterId);
    log('AddCharacterToXPPool:name: ' + name);
    SendChat(name);
    SendChat('<div><a href="!XP_tracker --AddId ' + characterId + '">' + name + '</a></div>');
    log(state.XP_Tracker.PoolIDs[id])
}


RemoveCharacterFromXPPool = function (id) {

}

AddXPToPool = function (xp) {

}

AppXPtoSelected = function (xp, ids) {

}

GetCharIDbyName = function (name) {

    var ActiveChar = GetAllActiveCharId(),
        FilteredList,
        i = 0;
    //log('GetCharIDbyName:name:' + name);
    //ActiveChar.forEach(function (c) {
    //    log('GetCharIDbyName:GetCharName(CharId):' + GetCharName(CharId));
    //    if (GetCharName(CharId).indexOf(name) !== -1) {
    //        FilteredList[i++] = CharId
    //        log('GetCharIDbyName:found name:' + GetCharName(CharId))
    //    };
    //})
    //return (FilteredList)
}

// The function takes a character ID and returns the character name.

GetCharName = function (id) {
    //log('GetCharName:id: ' + id)
    var Character = getObj("character", id);
    //log('GetCharName:Character: ' + Character)
    if ('undefined' !== typeof Character) {

        if ('undefined' !== typeof Character.attributes.name) {
            var name = Character.attributes.name;
        };
    };

    //log('GetCharName:name: ' + name)
    return (name);
}

GetCharCurrentXP = function (ids) {

    var tempobj,
        result = {};

    if (ids.length == 0) {
        // There is no matching character
        return;
    }

    ids.forEach(function (id) {
        result[id].xp_next_level = getAttrByName(id, "xp_next_level", "current");
        result[id].xp = getAttrByName(id, "xp", "current");
         = getObj("character", id);
        result[id].x = Character.attributes.name;

        return (result);
    });
}
GetAllActiveCharId = function () {
    var ActiveChar = findObjs({
        _type: 'attribute',
        name: 'is_npc'
    });

    _.each(ActiveChar, function (obj) {
        log("GetAllActiveCharId:Object.getOwnPropertyNames(obj.attributes): " + Object.getOwnPropertyNames(obj.attributes));
        log("GetAllActiveCharId:Object.obj.attributes.name: " + obj.attributes.name);
        log("GetAllActiveCharId:Object.obj.attributes.current: " + obj.attributes.current);
        log("GetAllActiveCharId:Found obj.Id: " + obj.id + " :" + obj.attributes.name + " :" + obj.attributes.current + " obj.attributes._id:" + obj.attributes._id);
    });
    //    log("GetAllActiveCharId:ActiveChar[100].id: " + ActiveChar[100].id);
    //    log("GetAllActiveCharId:ActiveChar PropertyNames: " + Object.getOwnPropertyNames(ActiveChar[100].attributes));
    //    log("GetAllActiveCharId:ActiveChar[100].attributes.name: " + ActiveChar[100].attributes.name);
    //    log("GetAllActiveCharId:ActiveChar PropertyNames: " + Object.getOwnPropertyNames(ActiveChar[100].attributes.current));
    //    log("GetAllActiveCharId:ActiveChar[100].attributes.current: " + ActiveChar[100].attributes.current);
    //ActiveChar = filterObjs(function (ActiveChar) {
    //    if (ActiveChar.attributes.is_npc.current == 0);
    //});
    //var ActivePC_ids = [],
    //    i = 0;

    //_.each(ActiveChar, function (obj) {
    //    if (getAttrByName(obj.id, "is_npc", "current") == 0) {
    //        ActivePC_ids[i++] = obj.id
    //    };
    //});

    //return (ActivePC_ids);
}

on("chat:message", function (msg) {
    if (msg.type == "api" && msg.content.indexOf("!XP_tracker") === 0) {

        if (!playerIsGM(msg.playerid)) {
            return;
        }

        var cmds,
            args = msg.content.split(/\s+--/);

        var ActiveCharacters;

        log(args)
        switch (args.shift()) {
            case '!XP_tracker':
                if (args.length > 0) {
                    cmds = args.shift().split(/\s+/);

                    log(cmds[0].toUpperCase())
                    switch (cmds[0].toUpperCase()) {
                        case 'HELP':
                            ShowHelp();
                            break;
                        case 'ADDTOKEN':
                            AddTokentoXPPool(msg);

                            break;
                        case 'ADD':
                            AddCharbyName(cmds[1]);
                            break;
                        case 'REMOVE':
                            RemoveCharacterFromXPPool();
                            break;
                        case 'XP':
                            AddXPToPool()
                            break;
                        case 'VIEW':
                            ViewPool();
                            log(Object.getOwnPropertyNames(state.XP_Tracker.Config).sort())
                            break;

                    }
                }
        }
    }
    log("End of Line!")
});