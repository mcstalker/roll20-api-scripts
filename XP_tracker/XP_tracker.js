/*functions to add:
    - ShowHelp
    - Show/edit configations.
        - Should you track changes in a handout?
        - Should you only track changes in a handout?
        - name of the handout to use?
        - ???
    - Create Handout
    - Send update to Handout
    - Rewrite SendChat to do most of the chat formating
    - Write function to send selected tokens XP to the pool.
    - Write function to send selected tokens XP to one or more characters (Do not know how to do this yet.
*/
// Preloads the API, setup state object, and creates XP_tracker Handout log if handout logging is enabled it does not exist.
// Input: None
// Output: None
on("ready", function () {
    "use strict";
    var CurrVersion = '0.1';

    if (!state.XP_Tracker) {
        state.XP_Tracker = {
            PoolIDs: {},
        };
    };
    if ((typeof state.XP_Tracker.Version === 'undefined') || (state.XP_Tracker.Version == CurrVersion)) {
        state.XP_Tracker.Version = CurrVersion
    }
    if (typeof state.XP_Tracker.Config === 'undefined') {
        state.XP_Tracker.Config = {};
    }
    if (typeof state.XP_Tracker.Config.TrackInHandout === 'undefined') {
        state.XP_Tracker.Config.TrackInHandout = true;
    }
    if (typeof state.XP_Tracker.Config.OnlyTrackInHandout === 'undefined') {
        state.XP_Tracker.Config.OnlyTrackInHandout = false;
    }
    if (typeof state.XP_Tracker.Config.HandoutName === 'undefined') {
        state.XP_Tracker.Config.HandoutName = "XP_Tracker Log";
    }
    if ((state.XP_Tracker.Config.TrackInHandout) && (typeof state.XP_Tracker.Config.HandoutObj === 'undefined') && (typeof state.XP_Tracker.Config.HandoutName !== '')) {
        state.XP_Tracker.Config.HandoutObj = findObjs({
            _type: "handout",
            name: state.XP_Tracker.Config.HandoutName
        })[0];
    }
    if (typeof state.XP_Tracker.PoolIDs === 'undefined') {
        state.XP_Tracker.PoolIDs = {};
    }
});

// This function send a message to the campaigns chat window from XP_tracker.
// Input: None
// Output: None
SendChat = function (msg) {
    sendChat('XP_tracker', msg)
}

// Need to work on this function...
// Input: None
// Output: None
ShowHelp = function () {
    //TBD
}

// The function display a list of active members of the XP pool.  The list contains the characters name, current XP, XP to next level and a button to add XP to a character or remove them.
// The function send the information to the campaign chat window.
// Input: None
// Output: None
DisplayPool = function () {
    var ChatMsg =
        '/w gm  <table border="1" cellspacing="0" cellpadding="0"> \
	                <tbody> \
		                <tr> \
			                <td colspan="3"><strong><em>Members of the Pool:</em></strong></td> \
		                </tr> \
                        <tr> \
                            <td><strong>Name</strong></td> \
                            <td><strong>Current XP</strong></td> \
                            <td><strong>XP to Next Level</strong></td> \
                            <td><strong>Add XP</strong></td> \
                            <td><strong>Remove</strong></td> \
                        </tr>',
        elm,
        ids = GetPoolMemberIDs();

    if (typeof ids === 'undefined') {
        CHATmsg +=
            '           <tr> \
                            <td>No Records Found</td> \
                        </tr>';

    }
    else if (typeof ids === 'string') {
        elm = GetCharCurrentXP(ids);
        ChatMsg +=
            '           <tr> \
                                <td>' + elm[ids].name + '</td> \
                                <td>' + elm[ids].XP + '</td> \
                                <td>' + elm[ids].XPNextLevel + '</td> \
                                <td><a href="!XP_tracker --xptoid  ?{Experience Points|0} ' + ids + '">Add XP</a> \
                                <td><a href="!XP_tracker --removeid ' + ids + '">Remove</a> \
                        </tr>';
    }
    else {
        ids.forEach(function (id) {
            elm = GetCharCurrentXP(id);
            ChatMsg +=
                '       <tr> \
                                <td>' + elm[id].name + '</td> \
                                <td>' + elm[id].XP + '</td> \
                                <td>' + elm[id].XPNextLevel + '</td> \
                                <td><a href="!XP_tracker --xptoid  ?{Experience Points|0} ' + id + '">Add XP</a> \
                                <td><a href="!XP_tracker --removeid ' + id + '">Remove</a> \
                        </tr>';
        });
    };

    ChatMsg +=
        '           </tbody> \
                </table>'
    SendChat(ChatMsg);
}

// The function returns a list if character IDs stored in the state.XP_Tracker.PoolIDs.
// Input: None 
// Output: an array of Characters IDs from state.XP_Tracker.PoolIDs
GetPoolMemberIDs = function () {
    if ('undefined' !== typeof state.XP_Tracker.PoolIDs) {
        return (Object.getOwnPropertyNames(state.XP_Tracker.PoolIDs));
    };
    return ('');
};

// The functions returns a array containing character IDs form the current selected tokens that are non-npc characters.
// Input: Roll20 msg object.
// Output: Array of character IDs from the selected tokens that are non-npc characters.
GetTokenCharID = function (msg) {
    var CharID = [],
        i = 0,
        tempobj;

    if (typeof msg.selected !== 'undefined') {
        _.each(msg.selected, function (obj) {
            tempobj = findObjs({ _type: obj._type, id: obj._id });
            if (('undefined' !== typeof tempobj[0].attributes.represents) && (tempobj[0].attributes.represents !== "")) {
                if (!IsNPC(tempobj[0].attributes.represents)) {
                    CharID[i++] = tempobj[0].attributes.represents;
                }
            };
        });
    }

    return (CharID);
}

// Add selected tokens of non-npc characters to the state.XP_Tracker.PoolIDs
// Input: Roll20 msg object.
// Output: None.
AddTokentoXPPool = function (msg) {
    AddIdToPool(GetTokenCharID(msg));
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

//The function adds one or more ids to the XP_tracker pool if they are not already a member.
//  Input one of more character IDs.
//  Output no return.
//      Report changes campaign chat.  And, if handout logging is enabled it will log added characters.  
AddIdToPool = function (ids) {

    var ChatMsg;

    if ((typeof ids === 'undefined') || (ids.length == 0)) {
        // There is no matching character
        ChatMsg = "/w gm No Characters were added to the XP Pool because no non-NPC characters were found.";
    }
    else if (typeof ids === 'string') {
        if (typeof state.XP_Tracker.PoolIDs[id] === 'undefined') {
            state.XP_Tracker.PoolIDs[id] = GetCharName(id);
            ChatMsg = "/w gm <div>" + GetCharName(id) + " was added to the XP Pool.</div>";
            if (state.XP_Tracker.Config.TrackInHandout) {
                //Send log to handout.
            };
        };
    }
    else {
        ids.forEach(function (id) {
            if (typeof state.XP_Tracker.PoolIDs[id] === 'undefined') {
                state.XP_Tracker.PoolIDs[id] = GetCharName(id);
                if (typeof ChatMsg === 'undefined') {
                    ChatMsg = "/w gm <div>The following charecters where added to the XP Pool:";
                };
                ChatMsg += "<div>" + GetCharName(id) + ",</div>";
                if (state.XP_Tracker.Config.TrackInHandout) {
                    //Send log to handout.
                };
            };
        });

        ChatMsg += "</div>";
    };

    if (typeof ChatMsg === 'undefined') {
        ChatMsg = "/w gm No characters were added to the XP Pool becauce no non-NPC characters were found or they already are member.";
    };
    SendChat(ChatMsg);
    return;
}

//This function displayes a list of characters in the XP Pool and a button which will remove the character from the pool.
DisplayCharToBeRemovedFromXPPool = function () {
    var ChatMsg =
        '/w gm <table border="1" cellspacing="0" cellpadding="0"> \
	            <tbody> \
		            <tr> \
			            <td colspan="3"><strong><em>Characters in the XP Pool:</em></strong></td> \
		            </tr> \
		            <tr> \
			            <td colspan="3"><strong><em>Select the Character to Remove</em></strong></td> \
		            </tr>',
        ids = GetPoolMemberIDs();
    if ((typeof ids === 'undefined') || (ids.length == 0)) {
        // There is no matching character
        ChatMsg = "/w gm No Characters were added to the XP Pool becauce no non-NPC characters were found.";
    }
    else if (typeof ids === 'string') {
        if (typeof state.XP_Tracker.PoolIDs[id] !== 'undefined') {
            ChatMsg +=
                '   <tr> \
			            <td>' + GetCharName(id) + '</td> \
                        <td><a href="!XP_tracker --removeid '+ id + '">Remove</a> \
		            </tr>';
        };
    }
    else {
        ids.forEach(function (id) {
            ChatMsg +=
                '   <tr> \
			            <td>' + GetCharName(id) + '</td> \
                        <td><a href="!XP_tracker --removeid '+ id + '">Remove</a> \
		            </tr>';
        });
    };

    ChatMsg +=
        '       </tbody> \
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

// This function takes a block of XP and divids equally across all members of the XP pool.   
AddXPToPool = function (xp) {

    var ids = GetPoolMemberIDs();

    log('AddXPToPool:ids:' + ids);
    if (ids.length !== 0) {
        AddXPtoIds((xp / ids.length), ids);
    }
    else { return; };


}

AddXPtoTokens = function (xp, msg) {

    var ids = GetTokenCharID(msg);

    log('AppXPtoSelected:ids:' + ids);
    if (ids.length !== 0) {
        AddXPtoIds((xp / ids.length), ids);
    }
    else { return; };
}

AddXPtoIds = function (xp, ids) {

    log("AddXPtoIds:start");

    if ((typeof ids === 'undefined') || (ids.length == 0)) {
        // There is no matching character
        log("AddXPtoIds:if");
    }
    else if (typeof ids === 'string') {
        log("AddXPtoIds:else if");
        AddXPtoId(xp, ids);
    }
    else {
        log("AddXPtoIds:else");
        ids.forEach(function (id) {
            AddXPtoId(xp, id);
        });
    };
    return;
}

AddXPtoId = function (xp, id) {

    log("AddXPtoId:start");
    log("AddXPtoId:id" + id);
    if ((typeof id !== 'undefined') && (typeof id === 'string') && (id.length != 0)) {

        log("AddXPtoId:if");
        var CurrXP = GetCharCurrentXP(id),
        Obj = findObjs({ _type: "attribute", name: "xp", _characterid: id })[0];
        if (typeof Obj !== 'undefined') {
            log("AddXPtoId:if");
            Obj.set("current", (parseInt(CurrXP[id].XP) + parseInt(xp)));
            SendChat(CurrXP[id].name + ' as reseved ' + xp + ' experience points.');
            if (parseInt(CurrXP[id].XP) + parseInt(xp) >= CurrXP[id].XPNextLevel) {
                SendChat(CurrXP[id].name + ' has leveled up.')
            }
            if (state.XP_Tracker.Config.TrackInHandout) {
                //Send log to handout.
            };
        }
    }
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

GetPoolSize = function () {

    return (GetPoolMemberIDs().length);

}

GetCharCurrentXP = function (ids) {

    var result = {};

    log("GetCharCurrentXP:ids: " + ids);
    log("GetCharCurrentXP:ids.length: " + ids.length);
    if ((typeof ids === 'undefined') || (ids.length == 0)) {
        // There is no matching character
        return;
    }
    else if (typeof ids === 'string') {
        result[ids] = {
            XP: getAttrByName(ids, "xp", "current"),
            name: getObj("character", ids),
            XPNextLevel: getAttrByName(ids, "xp_next_level", "current")
        };
        result[ids].name = result[ids].name.attributes.name;
    }
    else {
        ids.forEach(function (id) {
            result[id] = {
                XP: getAttrByName(id, "xp", "current"),
                name: getObj("character", id),
                XPNextLevel: getAttrByName(id, "xp_next_level", "current")
            };
            result[id].name = result[id].name.attributes.name;
        });
    }

    return (result);
}

IsNPC = function (id) {
    var is_npc = findObjs({
        _characterid: id,
        name: 'is_npc'
    })[0];

    log("IsNPC:id: " + id);
    log("IsNPC:is_npc: " + is_npc);

    log("IsNPC:Object.getOwnPropertyNames(is_npc): " + Object.getOwnPropertyNames(is_npc));
    if ((!is_npc) && (is_npc == 1)) {
       return (true);
    }

    is_npc = findObjs({
        _characterid: id,
        name: 'npc'
    })[0];

    log("IsNPC:is_npc: " + is_npc);

    if ((!is_npc) && (is_npc == 1)) {
        return (true);
    }

    return (false);
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
                            DisplayCharToBeRemovedFromXPPool();
                            break;
                        case 'REMOVETOKEN':
                            RemoveTokenFromXPPool(msg);
                            break;
                        case 'REMOVEID':
                            RemoveCharacterIdFromXPPool(cmds[1]);
                            break;
                        case 'XPTOPOOL':
                            AddXPToPool(cmds[1])
                            break;
                        case 'XPTOTOKEN':
                            AddXPtoTokens(cmds[1], msg)
                            break;
                        case 'XPTOID':
                            AddXPtoIds(cmds[1], cmds[2])
                            break;
                        case 'LIST':
                            DisplayPool();
                            break;
                    }
                }
        }
    }
    log("End of Line!")
});