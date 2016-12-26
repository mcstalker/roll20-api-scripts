'use strict';

/*functions to add:
    - ShowHelp
    - Show/edit configurations.
        - Should you track changes in a handout?
        - Should you only track changes in a handout?
        - name of the handout to use?
        - ???
    - Create Handout
    - Send update to Handout
    - Rewrite SendLog to do most of the chat formating
    - Write function to send selected tokens XP to the pool.
    - Write function to send selected tokens XP to one or more characters (Do not know how to do this yet.
*/
// Preload the API, setup state object, and creates XP_tracker Handout log if handout logging is enabled it does not exist.
// Input: None
// Output: None

on("ready", function () {
    var CurrVersion = '0.3';

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
    if ((state.XP_Tracker.Config.TrackInHandout) && (state.XP_Tracker.Config.HandoutName)) {
        if (!GetHandout()) {
            CreateHandoutLog();
        }
    }
    if (typeof state.XP_Tracker.PoolIDs === 'undefined') {
        state.XP_Tracker.PoolIDs = {};
    }

    log("XP Tracker Version " + state.XP_Tracker.Version + " is now ready.");
});

// This function send a message to the campaigns chat window from XP_tracker
// Input: String = message to send
// Output: None
SendLog = function (msg) {
    if (!state.XP_Tracker.Config.OnlyTrackInHandout) {
        sendChat('XP_tracker', msg);
    }
    if (state.XP_Tracker.Config.TrackInHandout) {
        WriteToHandoutLog(msg);
    };
}
SendChat = function (msg) {
    sendChat('XP_tracker', msg);
}
//This function will create a handout log if it does not exist and add the obj to the state.XP_Tracker.Config.HandoutObj
// Input: None
// Output: If successful Roll20 Handout Object, on failure null 
CreateHandoutLog = function () {

    var HandoutObj = createObj("handout", {
        name: state.XP_Tracker.Config.HandoutName,
        inplayerjournals: "all",
        archived: false
    });

    if (HandoutObj) {
        HandoutObj.set('notes', '<h3>XP_tracker Log created on ' + GetTimeStamp() + '</h3>');
        return (HandoutObj);
    }
    else {
        return (null);
    }
}

// This function will connect to the handout in found in state.XP_Tracker.Config.HandoutName or if it is not found it will call CreateHandoutLog () to create a new one
// Input: None
// Output: Roll20 Handout Object 
GetHandout = function () {
    var HandoutObj = filterObjs(function (o) {
        return ('handout' === o.get('type') && state.XP_Tracker.Config.HandoutName === o.get('name') && false === o.get('archived'));
    })[0];

    if (HandoutObj) {
        return (HandoutObj);
    }
    else {
        return (CreateHandoutLog());
    }
}

// Thus function generates a date/time string in UTC
// Input: None
// Output: String = date/time UTC
GetTimeStamp = function () {
    var d = new Date(),
        datestamp = (d.getMonth() + 1) + '\\' + d.getDate() + '\\' + d.getFullYear() + '  ' + d.getHours() + ':',
        Minute = d.getMinutes(),
        Second = d.getSeconds();

    if (Minute < 10) {
        datestamp += '0';
    }

    datestamp += Minute + ':';

    if (Second < 10) {
        datestamp += '0';
    }

    datestamp += Second + ' UTC';

    return (datestamp)
}

//This function will append to the handout log
// Input: String = message to send
// Output: None
WriteToHandoutLog = function (msg) {

    var HandoutObj = GetHandout(),
        text;

    HandoutObj.get('notes', function (Notes) {
        Notes = Notes + "<br>" + GetTimeStamp() + '::' + msg;
        setTimeout(function () {
            HandoutObj.set('notes', Notes);
        }, 100);
    });
}

// Need to work on this function...
// Input: None
// Output: None
ShowHelp = function () {
    //TBD
}

// The function display a list of active members of the XP pool.  The list contains the characters name, current XP, XP to next level and a button to add XP to a character or remove them
// The function send the information to the campaign chat window
// Input: None
// Output: None
DisplayPool = function () {
    var msg =
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
        msg +=
            '           <tr> \
                            <td>No Records Found</td> \
                        </tr>';

    }
    else if (typeof ids === 'string') {
        elm = GetCharCurrentXP(ids);
        msg +=
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
            msg +=
                '       <tr> \
                                <td>' + elm[id].name + '</td> \
                                <td>' + elm[id].XP + '</td> \
                                <td>' + elm[id].XPNextLevel + '</td> \
                                <td><a href="!XP_tracker --xptoid  ?{Experience Points|0} ' + id + '">Add XP</a> \
                                <td><a href="!XP_tracker --removeid ' + id + '">Remove</a> \
                        </tr>';
        });
    };

    msg +=
        '           </tbody> \
                </table>'
    SendChat(msg);
}

// The function returns a list if character IDs stored in the state.XP_Tracker.PoolIDs
// Input: None 
// Output: Array = Containing Characters IDs from state.XP_Tracker.PoolIDs
GetPoolMemberIDs = function () {
    if ('undefined' !== typeof state.XP_Tracker.PoolIDs) {
        return (Object.getOwnPropertyNames(state.XP_Tracker.PoolIDs));
    };
    return ('');
};

// The functions returns a array containing character IDs form the current selected tokens that are non-npc characters
// Input: Roll20 msg object.
// Output: Array of character IDs from the selected tokens that are non-npc characters
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
// Input: Roll20 msg object
// Output: None
AddTokentoXPPool = function (msg) {
    AddIdsToXPPool(GetTokenCharID(msg));
}

// Need to work on this function...
AddCharbyName = function (name) {
}

//The function adds one or more ids to the XP_tracker pool if they are not already a member
//  Input: String or Array of strings = one of more Roll20 character IDs
//  Output None
//      Report changes campaign chat.  And, if handout logging is enabled it will log added characters
AddIdsToXPPool = function (ids) {

    if ((typeof ids === 'undefined') || (ids.length == 0)) {
        // There is no matching character
        SendChat("/w gm No Characters were added to the XP Pool because no non-NPC characters were found.");
    }
    else if (typeof ids === 'string') {
        AddIdToXPPool(id);
    }
    else {
        ids.forEach(function (id) {
            if (typeof state.XP_Tracker.PoolIDs[id] === 'undefined') {
                AddIdToXPPool(id);
            };
        });
    };
    return;
}

//This function adds a character ID entries to the state.XP_Tracker.PoolIDs
//  Input: String = Containing one Roll20 Character ID
//  Output None
AddIdToXPPool = function (id) {
    if (typeof state.XP_Tracker.PoolIDs[id] === 'undefined') {
        state.XP_Tracker.PoolIDs[id] = GetCharNameById(id);
        SendLog(GetCharNameById(id) + ' was added to the XP Pool.');
    }
}

//This function displays a list of characters in the XP Pool and a button which will remove the character from the pool
//  Input: None
//  Output None
DisplayCharToBeRemovedFromXPPool = function () {
    var msg =
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
        msg = "/w gm No Characters were added to the XP Pool becauce no non-NPC characters were found.";
    }
    else if (typeof ids === 'string') {
        if (typeof state.XP_Tracker.PoolIDs[id] !== 'undefined') {
            msg +=
                '   <tr> \
			            <td>' + GetCharNameById(id) + '</td> \
                        <td><a href="!XP_tracker --removeid '+ id + '">Remove</a> \
		            </tr>';
        };
    }
    else {
        ids.forEach(function (id) {
            msg +=
                '   <tr> \
			            <td>' + GetCharNameById(id) + '</td> \
                        <td><a href="!XP_tracker --removeid '+ id + '">Remove</a> \
		            </tr>';
        });
    };

    msg +=
        '       </tbody> \
               </table>';
    SendChat(msg);
}

//This function removes the character ID entries from the state.XP_Tracker.PoolIDs of the selected 
//  Input: Roll20 msg object
//  Output None
RemoveTokenFromXPPool = function (msg) {
    var ids = GetTokenCharID(msg);

    if (ids.length !== 0) {
        _.each(ids, function (id) {
            RemoveCharFromPool(id);
        });
    }
}

//This function removes a character ID entries from the state.XP_Tracker.PoolIDs
//  Input: String = Containing one Roll20 Character ID
//  Output None
RemoveCharacterIdFromXPPool = function (id) {
    RemoveCharFromPool(id);
}

//This function removes a character ID entries from the state.XP_Tracker.PoolIDs
//  Input: String = Containing one Roll20 Character ID
//  Output None
RemoveCharFromPool = function (id) {

    var msg;
    delete state.XP_Tracker.PoolIDs[id];

    msg = GetCharNameById(id) + ' was removed to the XP Pool.';

    SendLog(msg);
}

// This function takes a block of XP and divides equally across all members of the XP pool.   
AddXPToPool = function (xp) {

    var ids = GetPoolMemberIDs();

    if (ids.length !== 0) {
        AddXPtoIds((xp / ids.length), ids);
    }
    else { return; };


}

AddXPtoTokens = function (xp, msg) {

    var ids = GetTokenCharID(msg);

    if (ids.length !== 0) {
        AddXPtoIds((xp / ids.length), ids);
    }
    else { return; };
}

AddXPtoIds = function (xp, ids) {

    if ((typeof ids === 'undefined') || (ids.length == 0)) {
        // There is no matching character
    }
    else if (typeof ids === 'string') {
        AddXPtoId(xp, ids);
    }
    else {
        ids.forEach(function (id) {
            AddXPtoId(xp, id);
        });
    };
    return;
}

AddXPtoId = function (xp, id) {

    if ((typeof id !== 'undefined') && (typeof id === 'string') && (id.length != 0)) {

        var CurrXP = GetCharCurrentXP(id),
            Obj = getAttrObjectByName(id, 'xp'),
            nsg;

        if (typeof Obj !== 'undefined') {

            setAttrByName(id, 'xp', (parseInt(CurrXP[id].XP) + parseInt(xp)));
            msg = CurrXP[id].name + ' as received ' + xp + ' experience points for a total of ' + (parseInt(CurrXP[id].XP) + parseInt(xp)) + '.';
            if (parseInt(CurrXP[id].XP) + parseInt(xp) >= CurrXP[id].XPNextLevel) {
                msg += ' and has <span style="background-color: initial; color: rgb(0, 0, 0); font-size: 18px; font-weight: bold;">leveled up</span>';
            }
            SendLog(msg);
        }
    }
}

//// The function takes a character ID and returns the character name.
GetCharNameById = function (id) {
}

// The function takes a character ID and returns the character name.
GetCharName = function (id) {
    var Character = getObj("character", id),
        name;
    if ('undefined' !== typeof Character) {
        log(Character.name);
        name = Character.attributes.name;
    };

    return (name);
}

// The function takes a character ID and returns the character name.
GetCharNameById = function (id) {
    var Character = getObj("character", id);
    if (typeof Character !== 'undefined') {
        {
            var name = Character.attributes.name;
        };

        return (name);
    }
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
    var AttrbutesToSearchFor = ['is_npc', 'npc'],
    Obj,
    result = false;

    AttrbutesToSearchFor.forEach(function (AttrName) {
        Obj = getAttrObjectByName(id, AttrName);

        if (Obj) {
            if (Obj.attributes.current == 1) {
                result = true;
            }
        }
    });
    return (result);
}

getAttrObjectByName = function (id, AttrName) {
    const attr = findObjs({ type: 'attribute', characterid: id, name: AttrName });
    return attr && attr.length > 0 ? attr[0] : null;
}

getOrCreateAttr = function (id, AttrName) {

    var AttrObj = findObjs({ type: 'attribute', characterid: id, name: AttrName })[0];

    if (!AttrObj) {
        AttrObj = createObj('attribute', {
            name: AttrName,
            characterid: id
        });
    }
    return (AttrObj);
}

setAttrByName = function (id, AttrName, value) {
    getOrCreateAttr(id, AttrName).set('current', value);
}

on("chat:message", function (msg) {
    if (msg.type == "api" && msg.content.indexOf("!XP_tracker") === 0) {

        if (!playerIsGM(msg.playerid)) {
            return;
        }

        var cmds,
            args = msg.content.split(/\s+--/);

        var ActiveCharacters;

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
                        case 'TEST':
                            WriteToHandoutLog('test');
                            break;
                    }
                }
        }
    }
});
