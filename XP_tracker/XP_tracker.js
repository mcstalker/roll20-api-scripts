'use strict';

// Preload the API, setup state object, and creates XP_tracker Handout log if handout logging is enabled it does not exist.
//  Input: None
//  Output: None

on("ready", function () {
    var CurrVersion = '0.31.1',
        output_msg = '';

    if (!state.XP_Tracker) {
        state.XP_Tracker = {
            PoolIDs: {},
        };
    };
    if ((typeof state.XP_Tracker.Version === 'undefined') || (state.XP_Tracker.Version != CurrVersion)) {
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
        GetHandout();
    }
    if (typeof state.XP_Tracker.PoolIDs === 'undefined') {
        state.XP_Tracker.PoolIDs = {};
    }
    output_msg = "XP Tracker Version " + state.XP_Tracker.Version + " is now ready.";
    log(output_msg);
    SendChat(output_msg);
});

// Listens for call to API.  Then is reviews the argument list and calls the appropriate function.
//  Input: Object (Roll20_msg)
//  Output: None
on("chat:message", function (Roll20_msg) {
    if ((Roll20_msg.type == "api") && (Roll20_msg.content.toLowerCase().indexOf("!xp_tracker") === 0) && (playerIsGM(Roll20_msg.playerid))) {

        var cmds,
            args = Roll20_msg.content.split(/\s+--/),
            ActiveCharacters;

        switch (args.shift().toLowerCase()) {
            case '!xp_tracker':
                if (args.length > 0) {
                    cmds = args.shift().split(/\s+/);
                    switch (cmds[0].toLowerCase()) {
                        case 'help':
                            ShowHelp();
                            break;
                        case 'addtoken':
                            AddTokenToXPPool(Roll20_msg);
                            break;
                        case 'add':
                            AddCharByName(cmds[1]);
                            break;
                        case 'remove':
                            DisplayCharToBeRemovedFromXPPool();
                            break;
                        case 'removetoken':
                            RemoveTokenFromXPPool(Roll20_msg);
                            break;
                        case 'removeid':
                            RemoveCharacterIdFromXPPool(cmds[1]);
                            break;
                        case 'xptopool':
                            AddXPToPool(cmds[1])
                            break;
                        case 'xptotoken':
                            AddXPToTokens(cmds[1], Roll20_msg)
                            break;
                        case 'xptoid':
                            AddXPToIds(cmds[1], cmds[2])
                            break;
                        case 'list':
                            DisplayPool();
                            break;
                        case 'test':
                            WriteToHandoutLog('test');
                            break;
                        default:
                            SendChat('Error');
                            break;
                    }
                }
        }
    }
    else {
        SendChat('/w ' + Roll20_msg.playerid + ' You must be the GM to use this API.')
    }
});

// Need to work on this function...
AddCharByName = function (name) {
}

//The function adds one or more ids to the XP_tracker pool if they are not already a member
//  Input: String or Array of strings = one of more Roll20 character IDs
//  Output None
//      Report changes campaign chat.  And, if handout logging is enabled it will log added characters
AddIdsToXPPool = function (ids) {

    var output_msg = '';
    if ((typeof ids === 'undefined') || (ids.length == 0)) {
        // There is no matching character
        SendChat("/w gm No Characters were added to the XP Pool because no non-NPC characters were found.");
        return (false);
    }
    else if (typeof ids === 'string') {
        output_msg = AddIdToXPPool(id);
    }
    else {
        ids.forEach(function (id) {
            output_msg = NewLineCheck(output_msg) + AddIdToXPPool(id);
        });
    };
    SendLog(output_msg);
    return (true);
}

//This function adds a character ID entries to the state.XP_Tracker.PoolIDs
//  Input: String = Containing one Roll20 Character ID
//  Output None
AddIdToXPPool = function (id) {
    if (typeof state.XP_Tracker.PoolIDs[id] === 'undefined') {
        state.XP_Tracker.PoolIDs[id] = GetCharNameById(id);
        return (GetCharNameById(id) + ' was added to the XP Pool.');
    }
}

// Add selected tokens of non-npc characters to the state.XP_Tracker.PoolIDs
//  Input: Roll20_msg object
//  Output: None
AddTokenToXPPool = function (Roll20_msg) {
    AddIdsToXPPool(GetTokenCharID(Roll20_msg));
}

// Add XP to one character Id.
//  Input: Number(xp), Sting (Id)
//  Output: String(output_msg) or False on error
AddXPToId = function (xp, id) {

    if ((typeof id !== 'undefined') && (typeof id === 'string') && (id.length != 0)) {

        var CurrXP = GetCharCurrentXP(id),
            Obj = GetAttrObjectByName(id, 'xp'),
            output_msg = '';

        if (typeof Obj !== 'undefined') {

            SetAttrByName(id, 'xp', (parseInt(CurrXP[id].XP) + parseInt(xp)));
            output_msg = CurrXP[id].name + ' as received ' + xp + ' experience points for a total of ' + (parseInt(CurrXP[id].XP) + parseInt(xp)) + '.';
            if (parseInt(CurrXP[id].XP) + parseInt(xp) >= CurrXP[id].XPNextLevel) {
                output_msg += ' and has <span style="background-color: initial; color: rgb(0, 0, 0); font-size: 18px; font-weight: bold;">leveled up</span>';
            }
            return (output_msg);
        }
        return (false)
    }
}

// Add XP to one or more character Ids.
//  Input: Number(xp), Array of Strings (Ids)
//  Output: Boolean true on OK false on error
AddXPToIds = function (xp, ids) {
    
    var output_msg = '';

    if ((typeof ids === 'undefined') || (ids.len == 0)) {
        // There are no character ids
        SendChat("/w gm No Characters were found to get XP to.")
        return (false);
    }
    else if (typeof ids === 'string') {
        output_msg = AddXPToId(xp, ids);
    }
    else {

        ids.forEach(function (id) {
            output_msg = NewLineCheck(output_msg) + AddXPToId(xp, id);
        });
    };
    SendLog(output_msg);
    return (true);
}

// This function takes a block of XP and divides equally across all members of the XP pool. 
//  Input: Number(xp)
//  Output: none
AddXPToPool = function (xp) {

    var ids = GetPoolMemberIDs();

    if (ids.length !== 0) {
        AddXPToIds(Math.ceil(xp / ids.length), ids);
    }
    else { return; };


}

// This function takes a block of XP and divides equally across all selected non-NPC character tokens. 
//  Input: Number(xp), Object (Roll20_msg)
//  Output: none
AddXPToTokens = function (xp, Roll20_msg) {

    var ids = GetTokenCharID(Roll20_msg);

    if (ids.length !== 0) {
        AddXPToIds(Math.ceil(xp / ids.length), ids);
    }
    else { return; };
}

//This function will create a handout log if it does not exist and add the obj to the state.XP_Tracker.Config.HandoutObj
//  Input: None
//  Output: If successful Roll20 Handout Object, on failure null 
CreateHandoutLog = function () {

    var HandoutObj = createObj("handout", {
        name: state.XP_Tracker.Config.HandoutName,
        inplayerjournals: "all",
        archived: false
    });

    if (HandoutObj) {
        HandoutObj.set('notes', '<table><tbody><tr><td colspan="2"><h3>XP_tracker Log created on ' + GetTimeStamp() + '</h3></td></tr></tbody></table>');
        return (HandoutObj);
    }
    else {
        return (null);
    }
}

//This function displays a list of characters in the XP Pool and a button which will remove the character from the pool
//  Input: None
//  Output None
DisplayCharToBeRemovedFromXPPool = function () {
    var output_msg =
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
        output_msg = "/w gm No Characters were added to the XP Pool becauce no non-NPC characters were found.";
    }
    else if (typeof ids === 'string') {
        if (typeof state.XP_Tracker.PoolIDs[id] !== 'undefined') {
            output_msg +=
                '   <tr> \
			            <td>' + GetCharNameById(id) + '</td> \
                        <td><a href="!XP_tracker --removeid '+ id + '">Remove</a> \
		            </tr>';
        };
    }
    else {
        ids.forEach(function (id) {
            output_msg +=
                '   <tr> \
			            <td>' + GetCharNameById(id) + '</td> \
                        <td><a href="!XP_tracker --removeid '+ id + '">Remove</a> \
		            </tr>';
        });
    };

    output_msg +=
        '       </tbody> \
               </table>';
    SendChat(output_msg);
}

// The function display a list of active members of the XP pool.  The list contains the characters name, current XP, XP to next 
// level and a button to add XP to a character or remove them.  The function send the information to the campaign chat window
//  Input: None
//  Output: None
DisplayPool = function () {
    var output_msg =
        '/w gm  <table border="1" cellspacing="0" cellpadding="0"> \
	                 \
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
        output_msg +=
            '           <tr> \
                            <td>No Records Found</td> \
                        </tr>';

    }
    else if (typeof ids === 'string') {
        elm = GetCharCurrentXP(ids);
        output_msg +=
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
            output_msg +=
                '       <tr> \
                                <td>' + elm[id].name + '</td> \
                                <td>' + elm[id].XP + '</td> \
                                <td>' + elm[id].XPNextLevel + '</td> \
                                <td><a href="!XP_tracker --xptoid  ?{Experience Points|0} ' + id + '">Add XP</a> \
                                <td><a href="!XP_tracker --removeid ' + id + '">Remove</a> \
                        </tr>';
        });
    };

    output_msg +=
        '           </tbody> \
                </table>'
    SendChat(output_msg);
}

// The function finds attributes object by the object Id and the attributes name.
//  Input: String (Id), String (AttrName)
//  Output: Object (AttrObj) or null if not found
GetAttrObjectByName = function (id, AttrName) {
    const AttrObj = findObjs({ type: 'attribute', characterid: id, name: AttrName });
    return AttrObj && AttrObj.length > 0 ? AttrObj[0] : null;
}

GetCharacterObj = function (id) {
    return (getObj("character", id))
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
            name: GetCharNameById(ids),
            XPNextLevel: getAttrByName(ids, "xp_next_level", "current")
        };
    }
    else {
        ids.forEach(function (id) {
            result[id] = {
                XP: getAttrByName(id, "xp", "current"),
                name: GetCharNameById(id),
                XPNextLevel: getAttrByName(id, "xp_next_level", "current")
            };
        });
    }

    return (result);
}

// The function takes a character ID and returns the character name.
//  Input: Character Id
//  Output: Character Name or undefined if no name was found.
GetCharNameById = function (id) {
    return (GetCharacterObj(id).attributes.name);
}

// This function will connect to the handout in found in state.XP_Tracker.Config.HandoutName or if it is not found it will call CreateHandoutLog () to create a new one
//  Input: None
//  Output: Roll20 Handout Object 
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

GetOrCreateAttr = function (id, AttrName) {

    var AttrObj = findObjs({ type: 'attribute', characterid: id, name: AttrName })[0];

    if (!AttrObj) {
        AttrObj = createObj('attribute', {
            name: AttrName,
            characterid: id
        });
    }
    return (AttrObj);
}

GetPoolCurrentXP = function () {

    var result = GetCharCurrentXP(GetPoolMemberIDs());

    return (result);
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

GetPoolSize = function () {

    return (GetPoolMemberIDs().length);

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

// The functions returns a array containing character IDs form the current selected tokens that are non-npc characters
// Input: Roll20_msg object.
// Output: Array of character IDs from the selected tokens that are non-npc characters
GetTokenCharID = function (Roll20_msg) {
    var CharID = [],
        i = 0,
        tempobj;

    if (typeof Roll20_msg.selected !== 'undefined') {
        _.each(Roll20_msg.selected, function (obj) {
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

IsNPC = function (id) {
    var AttrbutesToSearchFor = ['is_npc', 'npc'],
    Obj,
    result = false;

    AttrbutesToSearchFor.forEach(function (AttrName) {
        Obj = GetAttrObjectByName(id, AttrName);

        if (Obj) {
            if (Obj.attributes.current == 1) {
                result = true;
            }
        }
    });
    return (result);
}

NewLineCheck = function (output_msg) {
    if ((typeof output_msg === 'string') && (output_msg.length > 0)) {
        return (output_msg + '<br/>');
    };
    return (output_msg);
}

//This function removes a character ID entries from the state.XP_Tracker.PoolIDs
//  Input: String = Containing one Roll20 Character ID
//  Output None
RemoveCharacterIdFromXPPool = function (id) {
    SendLog(RemoveCharFromPool(id));
}

//This function removes a character ID entries from the state.XP_Tracker.PoolIDs
//  Input: String = Containing one Roll20 Character ID
//  Output None
RemoveCharFromPool = function (id) {

    var output_msg = '';
    if (typeof state.XP_Tracker.PoolIDs[id] !== 'undefined') {
        delete state.XP_Tracker.PoolIDs[id];
        output_msg = GetCharNameById(id) + ' was removed to the XP Pool.';
        return (output_msg);
    }

}

//This function removes the character ID entries from the state.XP_Tracker.PoolIDs of the selected 
//  Input: Roll20_msg object
//  Output None
RemoveTokenFromXPPool = function (Roll20_msg) {
    var ids = GetTokenCharID(Roll20_msg),
        output_msg = '';

    if (ids.length !== 0) {
        _.each(ids, function (id) {
            output_msg = NewLineCheck(output_msg) + RemoveCharFromPool(id);
        });
        SendLog(output_msg);
    }
}

// This function send a message to the campaigns chat window from XP_tracker
// Input: String = message to send
// Output: None
SendChat = function (output_msg) {
    sendChat('XP_tracker', output_msg);
}

// This function send a message to the campaigns chat window from XP_tracker and if TrackInHandout is true it will update the handout log as well.
// Input: String = message to send
// Output: None
SendLog = function (output_msg) {
    if (!state.XP_Tracker.Config.OnlyTrackInHandout) {
        sendChat('XP_tracker', output_msg);
    }
    if (state.XP_Tracker.Config.TrackInHandout) {
        WriteToHandoutLog(output_msg);
    };
}

SetAttrByName = function (id, AttrName, value) {
    GetOrCreateAttr(id, AttrName).set('current', value);
}

// Need to work on this function...
// Input: None
// Output: None
ShowHelp = function () {
    //TBD
}

//This function will append to the handout log
// Input: String = message to send
// Output: None
WriteToHandoutLog = function (output_msg) {

    var HandoutObj = GetHandout(),
        text;

    HandoutObj.get('notes', function (Notes) {

        if (Notes.indexOf('</tbody></table>')) {
            Notes = Notes.slice(0, Notes.indexOf('</tbody></table>'));
        }
        log('WriteToHandoutLog:Notes:' + Notes);
        Notes = Notes + '<tr><td>' + GetTimeStamp() + '</td><td>' + output_msg + '</td></tr></tbody></table>';

        setTimeout(function () {
            HandoutObj.set('notes', Notes);
        }, 10);

    });
}
