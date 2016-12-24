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

// This function send a message to the campaigns chat window frin XP_tracker.
SendChat = function (msg) {
    sendChat('XP_tracker', msg)
}

// Need to work on this function...
ShowHelp = function () {
    //TBD
}

// The function sends the list of characters in the XP pool to the campaign chat.
ListPool = function () {
    var ChatMsg = '/w gm     <table border="1" cellspacing="0" cellpadding="0"> \
	                            <tbody> \
		                            <tr> \
			                            <td colspan="3"><strong><em>Members of the Pool:</em></strong></td> \
		                            </tr> \
                                    <tr> \
                                        <td><strong>Name</strong></td> \
                                        <td><strong>Current XP</strong></td> \
                                        <td><strong>XP to Next Level</strong></td> \
                                    </tr>';

    list = GetPoolCurrentXP();

    if (('undefined' !== typeof list) && (list !== '')) {

        _.each(list, function (elm) {
            ChatMsg += '<tr><td>' + elm.name + '</td><td>' + elm.XP + '</td><td>' + elm.XPNextLevel + '</td></tr>';
        });
    }
    else {
        CHATmsg += '<tr><td>No Records Found</tr></td>';
	};

    ChatMsg += '</tbody></table>'
    SendChat(ChatMsg);
}

// The function returns a kust if character IDs stored in the state.XP_Tracker.PoolIDs.
GetPoolMemberIDs = function () {
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
    var ids = GetTokenCharID(msg),
        ChatMsg;
    if (ids.length !== 0) {
        ChatMsg = "/w gm <div>The following charecters where added to the XP Pool:"
        _.each(ids, function (id) {
            state.XP_Tracker.PoolIDs[id] = GetCharName(id);
            ChatMsg += "<div>" + GetCharName(id) + ",</div>";
        });
        ChatMsg += "</div>";
    }
    else { ChatMsg = "/w gm No Characters were added to the XP Pool becauce no non-NPC characters were sekected." };

    SendChat(ChatMsg);
}

// Need to work on this function...
AddCharbyName = function (name) {

    var list = GetCharIDbyName(name);


    if (list.length == 0) {
        // There is no matching character
        return;
    }
    else {
        var ChatMsg = '/w gm <div>The following characters have been found that match the name you submitted.  Please select the character(s) you wish to add.'
        list.forEach(function (elm) {
            ChatMsg += '<div><a href="!XP_tracker --AddId ' + elm.id + '">' + GetCharName(elm.id) + '</a></div>';
        });
        ChatMsg += '</div>'
        SendChat(ChatMsg);
    }

    var characterId = list[0].id; // Assuming characters in the journal have unique names
    state.XP_Tracker.PoolIDs[id] = characterId;
    GetCharName(characterId);
    SendChat(name);
    SendChat('<div><a href="!XP_tracker --AddId ' + characterId + '">' + name + '</a></div>');
}

//This function displayes a list of characters in the XP Pool and 
RemoveCharacterFromXPPool = function () {
    var ChatMsg = '/w gm     <table border="1" cellspacing="0" cellpadding="0"> \
	                            <tbody> \
		                            <tr> \
			                            <td colspan="3"><strong><em>Characters in the XP Pool:</em></strong></td> \
		                            </tr> \
		                            <tr> \
			                            <td colspan="3"><strong><em>Select the Character to Remove</em></strong></td> \
		                            </tr>',
        ids = GetPoolMemberIDs();

    ids.forEach(function (id) {

        ChatMsg += '<tr> \
			        <td>' + GetCharName(id) + '</td> \
                    <td><a href="!XP_tracker --removeid '+ id + '">Remove</a> \
		            </tr>';
    });

    ChatMsg += '            </tbody> \
                             </table>';
    SendChat(ChatMsg);
}

RemoveTokenFromXPPool = function (msg) {
    var ids = GetTokenCharID(msg),
        ChatMsg;
    if (ids.length !== 0) {
        ChatMsg = "/w gm <div>The following charecters have been removed from the XP Pool:"
        _.each(ids, function (id) {
            ChatMsg += "<div>" + GetCharName(id) + ",</div>";
            RemoveCharFromPool(id);
        });
        ChatMsg += "</div>";
    }
    else { ChatMsg = "/w gm No Characters were removed from the XP Pool becauce no non-NPC characters were sekected." };

    SendChat(ChatMsg);
}

RemoveCharacterIdFromXPPool = function (id) {

    var ChatMsg = '/w gm Removing ' + GetCharName(id) + ' form XP Pool.';
    SendChat(ChatMsg);
    RemoveCharFromPool(id);

}

RemoveCharFromPool = function (id) {
    delete state.XP_Tracker.PoolIDs[id];
}

AddXPToPool = function (xp) {

    var XPeach,
        ids = GetPoolMemberIDs(),
        CurrXP = GetPoolCurrentXP(),
        newxp,
        CharObj;

    log('AddXPToPool:ida:' + ids);
    log('AddXPToPool:CurrXP:' + CurrXP);
    if (ids.length !== 0) {
        XPeach = xp / ids.length;
    }
    else { return; };

    ids.forEach(function (id) {

        newxp = parseFloat(CurrXP[id].XP + XPeach);
        if (newxp >= CurrXP[id].XPNextLevel) {
            SendChat(CurrXP[id].name + ' has leveled up.')
        }
        CharObj = getObj("character", id);

        var Obj = findObjs({ _type: "attribute", name: "xp", id })[0];
        currXP.set("current", newxp);
    });
}

AppXPtoSelected = function (xp, ids) {

}

GetCharIDbyName = function (name) {

    var ActiveChar = GetAllActiveCharId(),
        FilteredList,
        i = 0;

    //ActiveChar.forEach(function (c) {
    //    if (GetCharName(CharId).indexOf(name) !== -1) {
    //        FilteredList[i++] = CharId
    //    };
    //})
    //return (FilteredList)
}

// The function takes a character ID and returns the character name.
GetCharName = function (id) {
    var Character = getObj("character", id);
    if ('undefined' !== typeof Character) {

        if ('undefined' !== typeof Character.attributes.name) {
            var name = Character.attributes.name;
        };
    };

    return (name);
}

GetPoolCurrentXP = function () {

    var result = GetCharCurrentXP(GetPoolMemberIDs());

    return (result);
}

GetCharCurrentXP = function (ids) {

    var result = {};

    if (ids.length == 0) {
        // There is no matching character
        return;
    }

    ids.forEach(function (id) {
        result[id] = {
            XP: getAttrByName(id, "xp", "current"),
            name: getObj("character", id),
            XPNextLevel: getAttrByName(id, "xp_next_level", "current")
        };
        result[id].name = result[id].name.attributes.name;
    });
    return (result);
}

GetAllActiveCharId = function () {
    var ActiveChar = findObjs({
        _type: 'attribute',
        name: 'is_npc'
    });

    _.each(ActiveChar, function (obj) {
    });
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
                        case 'REMOVETOKEN':
                            RemoveTokenFromXPPool(msg);
                            break;
                        case 'REMOVEID':
                            RemoveCharacterIdFromXPPool(cmds[1]);
                            break;
                        case 'XPTOPOOL':
                            AddXPToPool()
                            break;
                        case 'XPTOTOKEN':
                            AddXPToPool()
                            break;
                        case 'LIST':
                            ListPool();
                            break;
                    }
                }
        }
    }
    log("End of Line!")
});
