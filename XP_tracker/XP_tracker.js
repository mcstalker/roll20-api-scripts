// Perloads the api
on("ready", function () {
    "use strict";

    if (!state.XP_Tracker) {
        state.XP_Tracker = {
            Version: '0.1',
            Config: {},
            PoolIDs: {},
            PoolCount: 0
        };
    };
    log("on:ready" + state.XP_Tracker.Version);
    log("XP Tracker Version " + state.XP_Tracker.Version + " is now ready.");
});


ShowHelp = function () {

}

ViewPool = function () {
    var output = '/w gm <div>Members of the Pool<div><table border=\"1\">';
    //        <td>Row 1, Column 1</td> \
    //        <td>Row 1, Column 2</td> \
    //    </tr> \
    //    <tr> \
    //        <td>Row 1, Column 1</td> \
    //        <td>Row 1, Column 2</td> \
    //    </tr> \
    //    <tr> \
    //        <td>Row 2, Column 1</td> \
    //        <td>Row 2, Column 2</td> \
    //    </tr> \
    //</table>';

    list = GetPoolMembers();
    log(list);
    if (('undefined' !== typeof list) && (list !== '')) {

        log("ViewPool:list: " + list);
        sendChat(' '.list);
        list.forEach(function (elm) {
            output += '<tr><td>' + elm + '</td><td>' + GetCharName(elm) + '</td></tr>';
            log("ViewPool:elm: " + elm);
        });
        output += '</table></div>'
        sendChat(' ', output);
    };
}

Setup_XP_Char = function () {

}

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

    //log("GetTokenCharID:msg.selected: " + msg.selected);
    //log("GetTokenCharID:msg.selected:object.getOwnPropertyNames(msg.selected[0]).sort(): " + Object.getOwnPropertyNames(msg.selected[0]).sort())
    _.each(msg.selected, function (obj) {
        tempobj = findObjs({ _type: obj._type, id: obj._id });
        //log("GetTokenCharID:msg.selected:tempobj[0].attributes.represents" + tempobj[0].attributes.represents)
        if (('undefined' !== typeof tempobj[0].attributes.represents) && (tempobj[0].attributes.represents !== "")) {
            if (getAttrByName(tempobj[0].attributes.represents, "is_npc", "current") == 0) {
                CharID[i++] = tempobj[0].attributes.represents;
                //log("GetTokenCharID:ID: " + CharID[i - 1] + " Name: " + GetCharName(CharID[i - 1]));
            }
        };
    });
    return (CharID);
}

AddTokentoXPPool = function (msg) {
    var CharID = GetTokenCharID(msg);
    log("AddTokentoXPPool:CharID: " + CharID);
    _.each(CharID, function (Id) {
        log("AddTokentoXPPool:ID: " + Id + " Name: " + GetCharName(Id));
        state.XP_Tracker.PoolIDs[Id] = GetCharName(Id);
        state.XP_Tracker.PoolCount++;
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
        sendChat('', output);
    }

    var characterId = list[0].id; // Assuming characters in the journal have unique names
    state.XP_Tracker.PoolIDs[id] = characterId;
    GetCharName(characterId);
    log('AddCharacterToXPPool:name: ' + name);
    sendChat('', name);
    sendChat('XP_Tracker', '<div><a href="!XP_tracker --AddId ' + characterId + '">' + name + '</a></div>');
    log(state.XP_Tracker.PoolIDs[id])
}


RemoveCharacterFromXPPool = function (id) {

}

AddXPToPool = function (xp) {

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
GetPCXP = function (ActivePC_ids) {

    var xp_next_level,
        xp,
        name,
        Character;

    ActivePC_ids.forEach(function (id) {
        xp_next_level = getAttrByName(id, "xp_next_level", "current");
        xp = getAttrByName(id, "xp", "current");
        //name = getAttrByName(id, "name", "current");
        log("before " + Character);
        Character = getObj("character", id);

        name = Character.attributes.name;
        log(Object.getOwnPropertyNames(Character.attributes));
        log("Name: " + name + " Current XP: " + xp + " XP to next level: " + xp_next_level + "XP to next Level: " + (xp_next_level - xp))
        return (name);
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