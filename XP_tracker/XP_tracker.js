// Preload the API, setup state object, and creates XP_tracker Handout log if handout logging is enabled it does not exist.
//  Input: None
//  Output: None

on('ready', function () {
    'use strict';

    XP_Tracker.CheckInstalled();
    XP_Tracker.RegisterEventHandlers();
});

var HTMLScripter = HTMLScripter || (function () {
    'use strict';

    this.build = function build(tag, html, attr) {

        // you can skip html param
        if (typeof (html) === 'number') {
            html = html.toString();
        }
        else if (typeof (html) !== 'string') {
            attr = html;
            html = null;
        }
        var h = '<' + tag + ' ' + AttrsToString(attr);

        return h += html ? ">" + html + "</" + tag + ">" : "/>";
    };

    var AttrsToString = function AttrsToString(attrs) {

        var AttrsList = [];
        if (typeof (attrs) === 'undefined') {
            return ('');
        }

        if ((typeof (attrs.style) !== 'undefined') && (attrs.style)) {
            attrs.style = CSSStyle(attrs.style);
        }

        _.each(attrs, function (value, key) {
            AttrsList.push(key + ' = "' + value + '"');
        });

        return AttrsList.join(' ');
    };

    var CSSStyle = function CSSStyle(Styles) {

        var StyleList = [];

        _.each(Styles, function (value, key) {
            StyleList.push(key + ': ' + value + '; ');
        });

        return StyleList.join(' ');
    };
});

var XP_Tracker = XP_Tracker || (function () {
    'use strict';

     // #region Variables

    var DebugEnalbed = true;
    const
        CurrVersion = '0.6.0b', // Current Vision of the XP_Tracker API.
        CurrSchema = '0.2', // Current Schema Vision of the XP_Tracker API.
        COMMAND_BASE = '!xp_tracker',
        COMMAND_SET_CHARACTER_SHEET = '!xp_tracker_setcharactersheet', // Set the default character sheet. 
        COMMAND_ADD_XP_TO_ID = '!xp_tracker_add_xp_to_id', //
        COMMAND_ADD_TOKEN_TO_POOL = '!xp_tracker_add_token_to_pool', //
        COMMAND_ADD_TOKEN_XP_TO_POOL = '!xp_tracker_add_token_xp_to_pool', //
        COMMAND_REMOVE_FROM_POOL = '!xp_tracker_renove_from_pool', //
        COMMAND_XP_TO_POOL = '!xp_tracker_xp_to_pool', //
        COMMAND_REMOVE_CHARACTER_LIST = '!xp_tracker_remove_character_list', //
        COMMAND_SHOW_HELP = '!xp_tracker_help', //
        COMMAND_SHOW_SETTINGS = '!xp_tracker_settings', //
        COMMAND_TOGGLE_TRACK_IN_HANDOUT = '!xp_tracker_toggle_track_in_handout',
        COMMAND_TOGGLE_UPDATE_CHARACTER_SHEET = '!xp_tracker_toggle_update_character_sheet',
        COMMAND_TOGGLE_TRACK_BY_SESSION = '!xp_tracker_toggle_track_by_session',
        COMMAND_TOGGLE_REMOVE_ARCHIVED = '!xp_tracker_toggle_remove_archived',
        COMMAND_RENAME_HANDOUT = '!xp_tracker_rename_handout',
        COMMAND_END_SESSION = '!xp_tracker_end_session',

        HANDOUT_JOURNAL_LINK = 'http://journal.roll20.net/handout/',

        ChallengeRatingTable5e = { // D&D 5e challenge rating values to experience value.
            '0': 0, '1/8': 25, '1/4': 50, '1/2': 100, '1': 200, '2': 450,
            '3': 700, '4': 1100, '5': 1800, '6': 2300, '7': 2900, '8': 3900,
            '9': 5000, '10': 5900, '11': 7200, '12': 8400, '13': 10000, '14': 11500,
            '15': 13000, '16': 15000, '17': 18000, '18': 20000, '19': 22000, '20': 25000,
            '21': 33000, '22': 41000, '23': 50000, '24': 62000, '25': 75000, '26': 90000,
            '27': 105000, '28': 120000, '29': 135000, '30': 155000
        },
        DandD5eLevelTable = { // D&D 5e level chart.
            '1': 0, '2': 300, '3': 900, '4': 2700, '5': 6500,
            '6': 14000, '7': 23000, '8': 34000, '9': 48000, '10': 64000,
            '11': 85000, '12': 100000, '13': 120000, '14': 140000, '15': 165000,
            '16': 195000, '17': 225000, '18': 265000, '19': 305000, '20': 355000
        },
        SupportedCharacterSheetLayouts = { // Character sheet Attribute formate.
            '5th Edition ( OGL by Roll20 )': { PC_XP: 'experience', NPC_XP: null, ChallengeRating: 'npc_challenge', XP_Next_Level: null },
            '5th Edition (Community Contributed)': { PC_XP: 'xp', NPC_XP: 'npc_xp', ChallengeRating: 'npc_challenge', XP_Next_Level: 'xp_next_level' },
            '5th Edition (Shaped)': { PC_XP: 'xp', NPC_XP: 'xp', ChallengeRating: 'npc_challenge', XP_Next_Level: 'xp_next_level' }
        },
        Style_CSS = {
            span: { 'background-color': 'initial', 'color': 'rgb(0, 0, 0)', 'font-size': '18px', 'font-weight': 'bold' },
            div_outer: { 'background': '#fff', 'border': 'solid 1px #000', 'border-radius': '5px', 'font-weight': 'bold', 'margin-bottom': '1em', 'overflow': 'hidden' },
            div_inner: { 'background': '#000', 'color': '#fff', 'text-align': 'center' },
            div_left: { 'text-align': 'left' },
            table: { 'border': 'solid 1px #000', 'width': '100%', 'table-layout': 'fixed' },
            tr: { 'border': 'solid 1px #000' },
            tr_top: { 'border-style': 'solid', 'border-width': '1px 1px 0px 1px', 'border-color': '#000' },
            tr_middle: { 'border-style': 'solid', 'border-width': '0px 1px 0px 1px', 'border-color': '#000' },
            tr_bottom: { 'border-style': 'solid', 'border-width': '0px 1px 1px 1px', 'border-color': '#000' },
            td: { 'font-size': '0.8em', 'text-align': 'left', 'padding-left': '12px' },
            td_header: { 'font-size': '0.8em', 'text-align': 'center', 'font-weight': 'bold' },
            td_left: { 'font-size': '0.8em', 'text-align': 'left', 'font-weight': 'bold' },
            td_right: { 'font-size': '0.8em', 'text-align': 'right', 'font-weight': 'bold' },
            td_action_detail_text: { 'font-size': '0.8em', 'text-align': 'left', 'padding-left': '24px' },
            td_text: { 'font-size': '0.8em', 'text-align': 'left' },
            td_button: { 'text-align': 'right', 'width': '50px' },
            td_end_session_button: { 'text-align': 'right', 'width': '75px' },
            td_add_selected_token_button: { 'text-align': 'right', 'width': '75px' },
            td_addaction: { 'text-align': 'center', 'width': '100%' },
            td_addbutton: { 'text-align': 'left', 'border-top': 'solid 1px #000', 'width': '100%' },
            td_more_less_button: { 'text-align': 'left', 'width': '50px' },
            td_more_less_action: { 'text-align': 'left', 'width': '50px', 'padding-left': '24px' },
            td_Handout_Log: { 'colspan': '2' },
            li: { 'padding': '10px', 'list-style-type': 'decimal' },
            a_addaction: { 'font-size': '10px', 'text-align': 'center', 'width': '75px', 'height': '13px', 'margin': '-5px 0 0 0', 'padding': '0 0 0 0', 'border-radius': '10px', 'border-color': '#000000', 'white-space': 'nowrap', 'background-color': '#028003' },
            a_greembutton: { 'font-size': '10px', 'text-align': 'center', 'width': '40px', 'height': '13px', 'margin': '-5px 0 0 0', 'padding': '0 0 0 0', 'border-radius': '10px', 'border-color': '#000000', 'white-space': 'nowrap', 'background-color': '#028003' },
            a_addbutton: { 'font-size': '10px', 'text-align': 'center', 'width': '50px', 'height': '13px', 'margin': '-5px 0 0 0', 'padding': '0 0 0 0', 'border-radius': '10px', 'border-color': '#000000', 'white-space': 'nowrap', 'background-color': '#028003' },
            a_end_session_button: { 'font-size': '10px', 'text-align': 'center', 'width': '75px', 'height': '13px', 'margin': '-5px 0 0 0', 'padding': '0 0 0 0', 'border-radius': '10px', 'border-color': '#000000', 'white-space': 'nowrap', 'background-color': '#028003' },
            a_add_selected_token_button: { 'font-size': '10px', 'text-align': 'center', 'width': '75px', 'height': '13px', 'margin': '-5px 0 0 0', 'padding': '0 0 0 0', 'border-radius': '10px', 'border-color': '#000000', 'white-space': 'nowrap', 'background-color': '#028003' },
            a_setting: { 'color': 'black', 'font-size': '10px', 'text-align': 'center', 'width': '50px', 'height': '13px', 'margin': '-5px 0 0 0', 'padding': '0 0 0 0', 'border-radius': '10px', 'border-color': '#000000', 'white-space': 'nowrap', 'background-color': 'yellow' },
            a_redbutton: { 'font-size': '10px', 'text-align': 'center', 'width': '40px', 'height': '13px', 'margin': '-5px 0 0 0', 'padding': '0 0 0 0', 'border-radius': '10px', 'border-color': '#000000', 'white-space': 'nowrap', 'background-color': '#FF0000' },
            a_help: { 'font-size': '1.4ex', 'line-height': '1.8ex', 'font-family': 'sans-serif', 'vertical-align': 'middle', 'font-weight': 'bold', 'text-align': 'center', 'text-decoration': 'none', 'display': 'inline-block', 'width': '1.8ex', 'height': '1.8ex', 'border-radius': '1.2ex', 'margin-right': '4px', 'padding': '1px', 'color': 'white', 'background': 'Blue', 'border': 'thin solid blue', 'font color': 'white' },
            a_enabled: { 'font-size': '10px', 'text-align': 'center', 'width': '40px', 'height': '13px', 'margin': '-5px 0 0 0', 'padding': '0 0 0 0', 'border-radius': '10px', 'border-color': '#000000', 'white-space': 'nowrap', 'background-color': '#028003' },
            a_disabled: { 'font-size': '10px', 'text-align': 'center', 'width': '40px', 'height': '13px', 'margin': '-5px 0 0 0', 'padding': '0 0 0 0', 'border-radius': '10px', 'border-color': '#000000', 'white-space': 'nowrap', 'background-color': 'red' },
            a_renamebutton: { 'font-size': '10px', 'text-align': 'center', 'width': '100px', 'height': '13px', 'margin': '-5px 0 0 0', 'padding': '0 0 0 0', 'border-radius': '10px', 'border-color': '#000000', 'white-space': 'nowrap', 'background-color': '#028003' },
            a_backbutton: { 'font-size': '10px', 'text-align': 'center', 'width': '50px', 'height': '13px', 'margin': '-5px 0 0 0', 'padding': '0 0 0 0', 'border-radius': '10px', 'border-color': '#000000', 'white-space': 'nowrap', 'background-color': '#028003' },
        },
        Trans = {
            TrackInHandout: 'Track in Handout',
            UpdateCharacterSheet: 'Update Character Sheet',
            TrackBySession: 'Track by Session',
            Name: 'Character Sheet Name',
            PC_XP_Attr: 'PC Exp Attribute',
            NPC_XP_Attr: 'NPC Exp Attribute',
            ChallengeRating: 'Challenge Rating Attribute',
            XP_Next_Level_Attr: 'Exp for Next Level Attribute',
            HandoutName: 'Handout Name',
            XP_Tracker_Header: 'XP Tracker',
            Pool_Header: 'Members of the Pool',
            Name_Header: 'Name',
            Current_XP: 'Current XP',
            Add_XP: 'Add XP',
            XP_to_Next_Level: 'XP to Next Level',
            Remove_Header: 'Remove',
            No_Records_Found: 'No Records Found',
            Add_XP_Button_Nane: 'Add XP',
            Add_XP_Button_Help: 'Click to add experience to this character.',
            Remove_Button_Nane: 'Remove',
            Remove_Button_Help: 'Click to remove the character from the experience pool.',
            Add_Selected_Token_Button_Name: 'Add Token',
            Add_Selected_Token_Button_Help: 'Click to add selected token character(s) to the experience pool.',
            XP_Macro: ' ?{Experience Points|0} ',
            Pool2_Header: 'Characters in the XP Pool',
            Character_Sheet_Message: 'Select Character Sheet',
            Select_Button_Name: 'Select',
            Character_Sheet_Marco: COMMAND_SET_CHARACTER_SHEET + ' ?{Character Sheet|' + Object.keys(SupportedCharacterSheetLayouts).join('|') + '}',
            Arcived_Character_Message: ' has been archived.  Should they be removed from the XP pool?',
            Yes_Button_Name: 'Yes',
            No_Characters_Add_To_Pool: 'No Characters were added to the XP Pool because no non-NPC characters were found.',
            Character_Added_To_Pool: 'been added to the XP Pool.',
            Add_XP_To_Ids_No_ID_Error: 'No Characters received any experiences because no valid char Ids were provided.',
            ADD_XP_To_Pool_From_Token_XP_NOT_FOUND_ERROR: 'No experience value was found for ',
            Not_GM_Message: ' You must be the GM to use this API.',
            Single_Player_Adv: ' has ',
            Multi_Player_Adv: ' have ',
            Level_Up: 'leveled up',
            Received: 'received ',
            XP_Each_Message: ' experience points',
            And: ' and ',
            Handout_Default_Name: 'XP_Tracker Log',
            Macro_Token_to_Pool_Name: 'SelectedTokensXPtoPool',
            Remove_Ids_From_XP_Pool_None_Removed_Message: 'No Characters were removed from the XP Pool because no non-NPC characters were found.',
            Remove_Ids_From_XP_Pool_Removed_Message: 'been removed from the XP Pool.',
            Help_Button_Title: 'Show Help',
            Setting_Button: 'Setting',
            Setting_Button_Title: 'Click to open setting menu.',
            Setting_Page_Header: 'Setting Page',
            Enabled: 'Enabled',
            Disabled: 'Disabled',
            Track_In_Handout_Name: 'Track XP in handout',
            Track_In_Handout_Help: 'When enabled all changes in XP will be tracked in the ' + state.XP_Tracker.Config.HandoutName + ' handout.',
            Handout_Name: 'Handout Name',
            Rename_Handout_Name: 'Rename Handout',
            Rename_Handout_Marco: COMMAND_RENAME_HANDOUT + ' ?{Handout Name}',
            Rename_Handout_Help: 'Rename the handout that is used to log XP changes.',
            Update_Character_Sheet_Name: 'Update character XP',
            Update_Character_Sheet_Help: 'When enabled XP that is added to the pool will also update character sheets (Only works on support character sheets.) If the Track By Session is enable the sheets will be updated when you click End of Session',
            Track_By_Session_Name: 'Track XP for session',
            Track_By_Session_Help: 'When enabled any XP added to the Pool will be stored until the session is ended.',
            Remove_Archived_Name: 'Remove Archive',
            Remove_Archived_Help: 'When enabled the script will automatically remove characters from the pool if they are archived. If disabled the GM(s) will be asked.',
            Current_Sheet_Name: 'Current Character Sheet',
            Change_Sheet_Button: 'Change Sheet',
            Change_Sheet_Help: 'Sheet the character sheet template your campaign is using.',
            Back_Button: 'Back',
            Session_XP_Header: 'Session XP:',
            Open_Session: 'XP from the last session has not been sent to the characters.  Would you like to send it now?',
            End_Sessiom_Button_Name: 'End Session',
            End_Session_Button_Help: 'Ends the session and sends XP to the character if Update character is enabled.',
        };

    // #endregion

    // The function adds one or more ids to the XP_tracker pool if they are not already a member
    //  Input: String or Array of strings = one of more Roll20 character IDs
    //  Output true if player was added to the pool false otherwise
    //      Report changes campaign chat.  And, if handout logging is enabled it will log added characters
    var AddIdsToXPPool = function AddIdsToXPPool(CharIds) {

        DebugMessage.apply(this, arguments);

        var AddedPlayers = [],
            i = 0;
        if (!(CharIds = CheckIdsVariable(CharIds))) {
            CreateButton(Trans.No_Characters_Add_To_Pool);
            return (false);
        }

        if (CharIds.length > 0) {
            CharIds.forEach(function (CharId) {
                if (AddIdToXPPool(CharId)) {
                    AddedPlayers[i++] = state.XP_Tracker.PoolIDs[CharId].Name;
                }
            });
        }

        if (AddedPlayers.length == 1) {
            CreateButton(AddedPlayers[0] + Trans.Single_Player_Adv + Trans.Character_Added_To_Pool);
            return (true);
        }
        else if (AddedPlayers.length > 1) {
            CreateButton(AddedPlayers.join(', ') + Trans.Multi_Player_Adv + Trans.Character_Added_To_Pool);
            return (true);
        }
        return (false);
    };

    // This function adds a character ID entries to the state.XP_Tracker.PoolIDs
    //  Input: String = Containing one Roll20 Character ID
    //  Output True if id was added false otherwise
    var AddIdToXPPool = function AddIdToXPPool(CharId) {

        DebugMessage.apply(this, arguments);

        if (!IsMember(CharId)) {
            var CharData = GetCharCurrentXP(CharId);

            state.XP_Tracker.PoolIDs[CharId] = {};
            state.XP_Tracker.PoolIDs[CharId].Name = CharData[CharId].Name;
            state.XP_Tracker.PoolIDs[CharId].CurrXP = CharData[CharId].CurrXP;
            state.XP_Tracker.PoolIDs[CharId].XPNextLevel = CharData[CharId].XPNextLevel;
            state.XP_Tracker.PoolIDs[CharId].SessionXP = 0;

            return (true);
        }
        return (false);
    };

    // 
    // 
    // 
    var AddOutputHeader = function AddOutputHeader(Output) {

        DebugMessage.apply(this, arguments);

        var HTML = new HTMLScripter();

        Output = HTML.build('div', Output, { style: Style_CSS.div_left });
        Output = HTML.build('div', Trans.XP_Tracker_Header, { style: Style_CSS.div_inner }) + Output;
        Output = HTML.build('div', Output, { style: Style_CSS.div_outer });

        return (Output);
    };

    // Add selected tokens of non-NPC characters to the state.XP_Tracker.PoolIDs
    //  Input: Roll20_msg object
    //  Output: None
    var AddTokenToXPPool = function AddTokenToXPPool(Roll20_msg) {

        DebugMessage.apply(this, arguments);

        AddIdsToXPPool(GetTokenCharID(Roll20_msg));
    };

    //
    //
    //
    var AddXPtoCharSheet = function AddXPtoCharSheet(CharId, XP) {
        if (state.XP_Tracker.Config.UpdateCharacterSheet) {
            SetAttrCurrentValueByName(CharId, state.XP_Tracker.Config.CharSheet.PC_XP_Attr, state.XP_Tracker.PoolIDs[CharId].CurrXP);
        }
    }

    // Add XP to one or more character Ids.
    //  Input: Number(xp), Array of Strings (Ids)
    //  Output: Boolean true on OK false on error
    var AddXPToIds = function AddXPToIds(XP, CharIds) {

        DebugMessage.apply(this, arguments);

        if (!(CharIds = CheckIdsVariable(CharIds))) {
            SendChat(Trans.Add_XP_To_Ids_No_ID_Error);
            return (false);
        }

        if (CharIds.length > 0) {
            CharIds.forEach(function (CharId) {

                if (state.XP_Tracker.Config.TrackBySession) {
                    state.XP_Tracker.PoolIDs[CharId].SessionXP = parseInt(XP) + parseInt(state.XP_Tracker.PoolIDs[CharId].SessionXP);
                    if (state.XP_Tracker.PoolIDs[CharId].SessionXP) {
                        state.XP_Tracker.Config.SessionOpen = true;
                    }
                }
                else {
                    state.XP_Tracker.PoolIDs[CharId].CurrXP = parseInt(XP) + parseInt(state.XP_Tracker.PoolIDs[CharId].CurrXP);
                    AddXPtoCharSheet(CharId, state.XP_Tracker.PoolIDs[CharId].CurrXP);
                }
            });
        }

    };

    // This function takes a block of XP and divides equally across all members of the XP pool. 
    //  Input: Number(xp)
    //  Output: none
    var AddXPToPool = function AddXPToPool(xp) {

        DebugMessage.apply(this, arguments);

        var CharIds = GetPoolMemberIDs();

        if (CharIds.length !== 0) {
            AddXPToIds(Math.ceil(xp / CharIds.length), CharIds);
            if (!state.XP_Tracker.Config.TrackBySession) {
                GenerateReport('', Math.ceil(xp / CharIds.length), CharIds);
            }            
        }
        else { return; }


    };

    // This function will find the XP value of the selected NPC tokens and it will add the experience value to the XP pool.
    //  Input: Roll20_msg object
    //  Output: None
    var AddXPToPoolFromToken = function AddXPToPoolFromToken(Roll20_msg) {

        DebugMessage.apply(this, arguments);

        var NPCIdObjArray = GetTokenNPCID(Roll20_msg),
            TempXP,
            TotalXP = 0;

        NPCIdObjArray.forEach(function (NPCObj) {
            TempXP = GetNPCXP(NPCObj.CharID);
            if (TempXP !== null) {
                TotalXP += parseInt(TempXP);
            }
            else {
                SendChat(Trans.ADD_XP_To_Pool_From_Token_XP_NOT_FOUND_ERROR + GetCharNameById(NPCObj.CharID) + '.');
            }
        });

        if (TotalXP > 0) {
            AddXPToPool(TotalXP);
        }
    };

    // This function takes a block of XP and divides equally across all selected non-NPC character tokens. 
    //  Input: Number(xp), Object (Roll20_msg)
    //  Output: none
    var AddXPToTokens = function AddXPToTokens(xp, Roll20_msg) {

        DebugMessage.apply(this, arguments);

        var ids = GetTokenCharID(Roll20_msg);

        if (ids.length !== 0) {
            AddXPToIds(Math.ceil(xp / ids.length), ids);
            if (!state.XP_Tracker.Config.TrackBySession) {
                GenerateReport('', Math.ceil(xp / ids.length), CharIds);
            }
        }
        else { return; }
    };

    //
    //
    //
    var AskForSheet = function AskForSheet() {

        DebugMessage.apply(this, arguments);

        CreateButton(Trans.Character_Sheet_Message, Trans.Select_Button_Name, Trans.Character_Sheet_Marco);
    };

    // Listens for call to API.  Then is reviews the argument list and calls the appropriate function.
    //  Input: Object (Roll20_msg)
    //  Output: None
    var ChatHandler = function ChatHandler(Roll20_msg) {

        DebugMessage.apply(this, arguments);

        var CharId,
            CharSheet,
            XP,
            arg,
            HandoutName;

        if ((Roll20_msg.type == "api") && (playerIsGM(Roll20_msg.playerid)) && (Roll20_msg.content.toLowerCase().indexOf(COMMAND_BASE) === 0)) {
            if (Roll20_msg.content.toLowerCase().indexOf(COMMAND_SET_CHARACTER_SHEET) === 0) {
                CharSheet = Roll20_msg.content.substr(Roll20_msg.content.indexOf(' ') + 1);
                SetCharacterSheet(CharSheet);
            }
            else if (Roll20_msg.content.toLowerCase().indexOf(COMMAND_ADD_XP_TO_ID) === 0) {
                arg = Roll20_msg.content.split(/\s+/);
                XP = arg.splice(1, 1)[0];
                CharId = arg.splice(1, 1)[0];
                AddXPToIds(XP, CharId);
                if (!state.XP_Tracker.Config.TrackBySession) {
                    GenerateReport('', XP, CharId);
                }
                DisplayPool();
            }
            else if (Roll20_msg.content.toLowerCase().indexOf(COMMAND_ADD_TOKEN_TO_POOL) === 0) {
                AddTokenToXPPool(Roll20_msg);
                DisplayPool();
            }
            else if (Roll20_msg.content.toLowerCase().indexOf(COMMAND_ADD_TOKEN_XP_TO_POOL) === 0) {
                AddXPToPoolFromToken(Roll20_msg);
                DisplayPool();
            }
            else if (Roll20_msg.content.toLowerCase().indexOf(COMMAND_XP_TO_POOL) === 0) {
                XP = Roll20_msg.content.substr(Roll20_msg.content.indexOf(' ') + 1);
                AddXPToPool(XP);
                DisplayPool();
            }
            else if (Roll20_msg.content.toLowerCase().indexOf(COMMAND_REMOVE_FROM_POOL) === 0) {
                CharId = Roll20_msg.content.substr(Roll20_msg.content.indexOf(' ') + 1);
                RemoveIdsFromXPPool(CharId);
                DisplayPool();
            }
            else if (Roll20_msg.content.toLowerCase().indexOf(COMMAND_REMOVE_CHARACTER_LIST) === 0) {
                CharId = Roll20_msg.content.substr(Roll20_msg.content.indexOf(' ') + 1);
                DisplayCharToBeRemovedFromXPPool();
            }
            else if (Roll20_msg.content.toLowerCase().indexOf(COMMAND_SHOW_SETTINGS) === 0) {
                ShowSettings();
            }
            else if (Roll20_msg.content.toLowerCase().indexOf(COMMAND_SHOW_HELP) === 0) {
                ShowHelp();
            }
            else if (Roll20_msg.content.toLowerCase().indexOf(COMMAND_TOGGLE_TRACK_IN_HANDOUT) === 0) {
                state.XP_Tracker.Config.TrackInHandout = ToggleConfiguration(state.XP_Tracker.Config.TrackInHandout);
                ShowSettings();
            }
            else if (Roll20_msg.content.toLowerCase().indexOf(COMMAND_TOGGLE_UPDATE_CHARACTER_SHEET) === 0) {
                state.XP_Tracker.Config.UpdateCharacterSheet = ToggleConfiguration(state.XP_Tracker.Config.UpdateCharacterSheet);
                ShowSettings();
            }
            else if (Roll20_msg.content.toLowerCase().indexOf(COMMAND_TOGGLE_TRACK_BY_SESSION) === 0) {
                state.XP_Tracker.Config.TrackBySession = ToggleTrackBySession(state.XP_Tracker.Config.TrackBySession);
                ShowSettings();
            }
            else if (Roll20_msg.content.toLowerCase().indexOf(COMMAND_TOGGLE_REMOVE_ARCHIVED) === 0) {
                state.XP_Tracker.Config.RemoveArchived = ToggleConfiguration(state.XP_Tracker.Config.RemoveArchived);
                ShowSettings();
            }
            else if (Roll20_msg.content.toLowerCase().indexOf(COMMAND_RENAME_HANDOUT) === 0) {
                HandoutName = Roll20_msg.content.substr(Roll20_msg.content.indexOf(' ') + 1);
                RenameHandout(HandoutName);
                ShowSettings();
            }
            else if (Roll20_msg.content.toLowerCase().indexOf(COMMAND_END_SESSION) === 0) {
                EndSession();
            }
            else {
                DisplayPool();
            }
        }
        else if (Roll20_msg.content.toLowerCase().indexOf(COMMAND_BASE) === 0) {
            CreateButton('/w ' +Roll20_msg.playerid +Trans.Not_GM_Message);
        }
    };

    // This function will check if a character Id that as been archived is in the XP Pool and then ask if the Id should be removed from the pool.  
    //  Input: Input: String = Containing one Roll20 Character ID
    //  Output: None
    var CharacterAchived = function CharacterAchived(Roll20_msg) {

        DebugMessage.apply(this, arguments);

        var CharId = Roll20_msg.attributes._id,
            CharObj = GetCharacterObj(CharId),
            CharName = CharObj.attributes.name;

        if ((IsMember(CharId)) && (CharObj.attributes.archived)) {

            if (state.XP_Tracker.Config.RemoveArchived) {
                RemoveIdsFromXPPool(CharId);
            }
            else {
                CreateButton(CharName + Trans.Arcived_Character_Message, Trans.Yes_Button_Name, COMMAND_REMOVE_FROM_POOL + ' ' + CharId);
            }
        }
    };

    // This function checks if a CharId has leveled up.  
    //  Input: String = Containing one Roll20 Character ID
    //  Output: True if id as leveled up.
    var CheckForLevelUp = function CheckForLevelUp(CharId) {
        log('CheckForLevelUp::CharId::' + CharId);
        log('CheckForLevelUp::CurrXP::' + state.XP_Tracker.PoolIDs[CharId].CurrXP);
        log('CheckForLevelUp::XPNextLevel::' + state.XP_Tracker.PoolIDs[CharId].XPNextLevel);
        if (state.XP_Tracker.PoolIDs[CharId].CurrXP >= state.XP_Tracker.PoolIDs[CharId].XPNextLevel) {
            log('CheckForLevelUp::If::TRUE');
            state.XP_Tracker.PoolIDs[CharId].XPNextLevel = GetXPNextLevel(state.XP_Tracker.PoolIDs[CharId].CurrXP);
            return (true);
        }
        log('CheckForLevelUp::Not of If');
        return (false);
    };

    // The function will check the Ids variable to see if it is null, a string or a list and it will return false if it is null or a list.
    //  Input: String or List of Strings = Containing one Roll20 Character ID
    //  Output: False if Ids is null else it return a list of ids. 
    var CheckIdsVariable = function CheckIdsVariable(Ids) {

        DebugMessage.apply(this, arguments);

        var temp = [];

        if ((typeof Ids === 'undefined') || (Ids.length === 0)) {
            return (false);
        }
        else if (typeof Ids === 'string') {
            temp[0] = Ids;
            return (temp);
        }
        else if (Array.isArray(Ids)) {
            return (Ids);
        }
    };

    // This function will check to see if the API has been installed correctly.  
    //  Input: None
    //  Output: None
    var CheckInstaller = function CheckInstall() {

        DebugMessage(arguments);

        if ((!state.XP_Tracker) || (typeof state.XP_Tracker.Schema === 'undefined') || (state.XP_Tracker.Schema != CurrSchema)) {
            CheckSchema();
        }
        GetMacro();
        GetHandout();
        if (state.XP_Tracker.Config.SessionOpen) {
            SessionOpenAtStart ();
        }
    };

    // This function will check the members of the pool to confirm that the characters have not been deleted or archived.  
    //  Input: None
    //  Output: If no characters have been deleted or archived the function will return true else false.
    var CheckPool = function CheckPool(Ids) {

        DebugMessage.apply(this, arguments);

        if (Ids === null) {
            Ids = GetPoolMemberIDs;
        }

        if (typeof Ids === 'undefined') {
            return (true);
        }
        else if (typeof Ids === 'string') {
            Ids[0] = Ids;
        }
        if (Ids.length > 0) {
            Ids.forEach(function (id) {
                Obj = GetCharacterObj(id);
                // if deleted or archived
                if ((Obj === null) || (Obj.archived)) {

                }
            });
        }
        return (true);
    };

    //This function will check to see if the API state variables schema is correctly.  
    //  Input: None
    //  Output: None
    var CheckSchema = function CheckSchema() {

        DebugMessage.apply(this, arguments);

        var CharDate;

        if (CurrSchema >= 0.1) {
            if (typeof state.XP_Tracker === 'undefined') {
                state.XP_Tracker = {};
            }

            if ((typeof state.XP_Tracker.Version === 'undefined') || (state.XP_Tracker.Version != CurrVersion)) {
                state.XP_Tracker.Version = CurrVersion;
            }
            if ((typeof state.XP_Tracker.Schema === 'undefined') || (state.XP_Tracker.Version != CurrSchema)) {
                state.XP_Tracker.Schema = CurrSchema;
            }
            if (typeof state.XP_Tracker.Config === 'undefined') {
                state.XP_Tracker.Config = {};
            }
            if (typeof state.XP_Tracker.Config.TrackInHandout === 'undefined') {
                state.XP_Tracker.Config.TrackInHandout = true;
            }
            if (typeof state.XP_Tracker.Config.UpdateCharacterSheet === 'undefined') {
                state.XP_Tracker.Config.UpdateCharacterSheet = true;
            }
            if (typeof state.XP_Tracker.Config.TrackBySession === 'undefined') {
                state.XP_Tracker.Config.TrackBySession = false;
            }
            if (typeof state.XP_Tracker.Config.RemoveArchived === 'undefined') {
                state.XP_Tracker.Config.RemoveArchived = false;
            }
            if (typeof state.XP_Tracker.Config.CharSheet === 'undefined') {
                state.XP_Tracker.Config.CharSheet = {};
                SetCharacterSheet();
            }
            if (typeof state.XP_Tracker.Config.HandoutName === 'undefined') {
                state.XP_Tracker.Config.HandoutName = Trans.Handout_Default_Name;
            }
            if ((state.XP_Tracker.Config.TrackInHandout) && (state.XP_Tracker.Config.HandoutName)) {
                GetHandout();
            }
            if (typeof state.XP_Tracker.PoolIDs === 'undefined') {
                state.XP_Tracker.PoolIDs = {};
            }
        }
        if (CurrSchema >= 0.2) {
            if (state.XP_Tracker.PoolIDs.length) {
                state.XP_Tracker.PoolIDs.forEach(function (id) {
                    CharDate = GetCharCurrentXP(id);
                    delete state.XP_Tracker.PoolIDs[id];
                    state.XP_Tracker.PoolIDs[id] = {};
                    state.XP_Tracker.PoolIDs[id].Name = CharDate.Name;
                    state.XP_Tracker.PoolIDs[id].SessionXP = 0;
                    state.XP_Tracker.PoolIDs[id].CurrXP = CharDate.CurrXP;
                    state.XP_Tracker.PoolIDs[id].XPNextLevel = CharDate.XPNextLevel;
                });
            }
            if (typeof state.XP_Tracker.Config.SessionOpen === 'undefined') {
                state.XP_Tracker.Config.SessionOpen = false;
            }
        }
    };

    // This function generates a message to the GM.  If the ButtonText is provided a button will be added.
    //  Input: Message, ButtonText, Link
    //  Output: None
    var CreateButton = function CreateButton(Message, ButtonText, Link) {

        DebugMessage.apply(this, arguments);

        var HTML = new HTMLScripter(),
            Output,
            Button;

        Output = HTML.build('td', Message, { style: Style_CSS.td_text });
        
        if (ButtonText) {
            Button = HTML.build('a', ButtonText, { style: Style_CSS.a_greembutton, href: Link });
            Output += HTML.build('td', Button, { style: Style_CSS.td_button });
        }
        Output = HTML.build('tr', Output, { style: Style_CSS.tr });
        Output = HTML.build('tbody', Output, {});
        Output = HTML.build('table', Output, { style: Style_CSS.table });

        Output = AddOutputHeader(Output);

        SendChat(Output);
    };

    // This function looks for XP_Tracker macros and creates them if they do not exist.
    //  Input: None
    //  Output: None
    var CreateMacro = function CreateMacro() {

        DebugMessage.apply(this, arguments);

        var GMs = GetGMs();

        _.each(GMs, GM => {
            createObj('macro', {
                _playerid: GM.get('_id'),
                name: Trans.Macro_Token_to_Pool_Name,
                action: COMMAND_ADD_TOKEN_XP_TO_POOL,
                istokenaction: true,
                archived: false
            });
        });
    };

    // This function will create a handout log if it does not exist and add the obj to the state.XP_Tracker.Config.HandoutObj
    //  Input: None
    //  Output: If successful Roll20 Handout Object, on failure null 
    var CreateHandoutLog = function CreateHandoutLog() {

        DebugMessage.apply(this, arguments);

        var HTML = new HTMLScripter(),
            HandoutDefaultNote = '',
            HandoutObj = createObj('handout', {
                name: state.XP_Tracker.Config.HandoutName,
                inplayerjournals: "all",
                archived: false
            });

        HandoutDefaultNote = HTML.build('h3', state.XP_Tracker.Config.HandoutName);
        HandoutDefaultNote = HTML.build('td', HandoutDefaultNote, { style: Style_CSS.td_Handout_Log });
        HandoutDefaultNote = HTML.build('tr', HandoutDefaultNote);
        HandoutDefaultNote = HTML.build('tbody', HandoutDefaultNote);
        HandoutDefaultNote = HTML.build('table', HandoutDefaultNote);

        if (HandoutObj) {
            HandoutObj.set('notes', HandoutDefaultNote);
            return (HandoutObj);
        }
        else {
            return (null);
        }
    };

    var DebugMessage = function DebugMessage(Args) {

        if (!DebugEnalbed) { return };

        //log('DebugMessage::2');
        //var err = new Error(),
        //    stack = new Error().stack,
        //    FunctionName = stack.split('\n')[2].trim(),
        //    LineNumber = FunctionName.split(':')[1] - 681,
        //    output;
        //log('DebugMessage::3');
        //if (typeof (Args) !== 'undefined') {
        //    log('DebugMessage::4');
        //    output = test.apply(this, Args);
        //    log('DebugMessage::5');
        //};
        //log('DebugMessage::6');
        //FunctionName = FunctionName.split(' ')[1];
        //log('DebugMessage::7');

        //log('stack::' + stack);
        //log('Error::' + 'XP_Tracker Debug Message:: in ' + FunctionName + ' at ' + LineNumber + '::' + Args);
        //log('Output::' + output);
    };

    // This function displays a list of characters in the XP Pool and a button which will remove the character from the pool
    //  Input: None
    //  Output None
    var DisplayCharToBeRemovedFromXPPool = function DisplayCharToBeRemovedFromXPPool() {

        DebugMessage.apply(this, arguments);

        var output_msg,
            TableRow,
            Button,
            CharIds = GetPoolMemberIDs(),
            HTML = new HTMLScripter();

        TableRow = HTML.build('td', Trans.Pool_Header, { style: Style_CSS.td_header, colspan: '3' });

        output_msg = HTML.build('tr', TableRow, { style: Style_CSS.tr });

        if (!(CharIds = CheckIdsVariable(CharIds))) {
            TableRow = HTML.build('td', Trans.No_Records_Found, { style: Style_CSS.td, colspan: '3' });
            output_msg += HTML.build('tr', TableRow, { style: Style_CSS.tr });
        }

        if (CharIds.length > 0) {
            CharIds.forEach(function (CharId) {
                Button = HTML.build('a', Trans.Remove_Button_Nane, { style: Style_CSS.a_redbutton, href: COMMAND_REMOVE_FROM_POOL + ' ' + CharId, title: Trans.Remove_Button_Help });

                TableRow = HTML.build('td', state.XP_Tracker.PoolIDs[CharId].Name, { style: Style_CSS.td_left, colspan: '2' }) +
                    HTML.build('td', Button, { style: Style_CSS.td_button });

                output_msg += HTML.build('tr', TableRow, { style: Style_CSS.tr_top });
            });
        }

        output_msg = HTML.build('tbody', output_msg, {});
        output_msg = HTML.build('table', output_msg, { style: Style_CSS.table });

        output_msg = AddOutputHeader(output_msg);
        SendChat(output_msg);
    };

    // The function display a list of active members of the XP pool.  The list contains the characters name, current XP, XP to next 
    // level and a button to add XP to a character or remove them.  The function send the information to the campaign chat window
    //  Input: None
    //  Output: None
    var DisplayPool = function DisplayPool() {

        DebugMessage.apply(this, arguments);

        var HTML = new HTMLScripter(),
            CharIds = GetPoolMemberIDs(),
            output_msg,
            TableRow,
            Button,
            CharacterNameRowSpan = 2;

        if (state.XP_Tracker.Config.TrackBySession) {
            CharacterNameRowSpan = 3;
        };

        TableRow = HTML.build('td', Trans.Pool_Header, { style: Style_CSS.td_header, colspan: '3' });

        output_msg = HTML.build('tr', TableRow, { style: Style_CSS.tr });

        TableRow = HTML.build('td', Trans.Name_Header, { style: Style_CSS.td_left }) +
            HTML.build('td', Trans.Current_XP, { style: Style_CSS.td_right }) +
            HTML.build('td', Trans.XP_to_Next_Level, { style: Style_CSS.td_right });

        output_msg += HTML.build('tr', TableRow, { style: Style_CSS.tr_top });

        if (!(CharIds = CheckIdsVariable(CharIds))) {
            TableRow = HTML.build('td', Trans.No_Records_Found, { style: Style_CSS.td, colspan: '3' });
            output_msg += HTML.build('tr', TableRow, { style: Style_CSS.tr });
        }

        if (CharIds.length > 0) {
            CharIds.forEach(function (CharId) {

                TableRow = HTML.build('td', state.XP_Tracker.PoolIDs[CharId].Name, { style: Style_CSS.td_left, rowspan: CharacterNameRowSpan }) +
                    HTML.build('td', state.XP_Tracker.PoolIDs[CharId].CurrXP, { style: Style_CSS.td_right }) +
                    HTML.build('td', state.XP_Tracker.PoolIDs[CharId].XPNextLevel, { style: Style_CSS.td_right });

                output_msg += HTML.build('tr', TableRow, { style: Style_CSS.tr_top });

                if (state.XP_Tracker.Config.TrackBySession) {
                    TableRow = HTML.build('td', Trans.Session_XP_Header, { style: Style_CSS.td_right }) +
                        HTML.build('td', state.XP_Tracker.PoolIDs[CharId].SessionXP, { style: Style_CSS.td_right });

                    output_msg += HTML.build('tr', TableRow, { style: Style_CSS.tr_middle });
                };

                TableRow = HTML.build('td', HTML.build('a', Trans.Add_XP_Button_Nane, { style: Style_CSS.a_greembutton, href: COMMAND_ADD_XP_TO_ID + Trans.XP_Macro + CharId, title: Trans.Add_XP_Button_Help }), { style: Style_CSS.td_button}) +
                    HTML.build('td', HTML.build('a', Trans.Remove_Button_Nane, { style: Style_CSS.a_redbutton, href: COMMAND_REMOVE_FROM_POOL + ' ' + CharId, title: Trans.Remove_Button_Help }), { style: Style_CSS.td_button });

                output_msg += HTML.build('tr', TableRow, { style: Style_CSS.tr_bottom });
            });
        }

        Button = HTML.build('a', Trans.Add_Selected_Token_Button_Name, { style: Style_CSS.a_add_selected_token_button, href: COMMAND_ADD_TOKEN_TO_POOL, title: Trans.Add_Selected_Token_Button_Help });
        TableRow = HTML.build('td', Button, { style: Style_CSS.td_add_selected_token_button });
        Button = HTML.build('a', '?', { style: Style_CSS.a_help, href: COMMAND_SHOW_HELP, title: Trans.Help_Button_Title });
        TableRow += HTML.build('td', Button, { style: Style_CSS.td_button });
        Button = HTML.build('a', Trans.Setting_Button, { style: Style_CSS.a_setting, href: COMMAND_SHOW_SETTINGS, title: Trans.Setting_Button_Title });
        TableRow += HTML.build('td', Button, { style: Style_CSS.td_button });
        
        output_msg += HTML.build('tr', TableRow, { style: Style_CSS.tr_top });

        if (state.XP_Tracker.Config.TrackBySession) {
            Button = HTML.build('a', Trans.End_Sessiom_Button_Name, { style: Style_CSS.a_end_session_button, href: COMMAND_END_SESSION, title: Trans.End_Session_Button_Help });
            TableRow = HTML.build('td', Button, { style: Style_CSS.td_end_session_button });
            output_msg += HTML.build('tr', TableRow, { style: Style_CSS.tr_middle });
        }
        output_msg = HTML.build('tbody', output_msg, {});
        output_msg = HTML.build('table', output_msg, { style: Style_CSS.table });

        output_msg = AddOutputHeader(output_msg);
        SendChat(output_msg);
    };

    // The function will send any XP stored in the SessionXP variables to the characters and clear the values.
    //  Input: None
    //  Output: None
    var EndSession = function EndSession() {

        var CharIds = GetPoolMemberIDs(),
            Players_Report = {};

        log('CharIds::' + CharIds);

        if (!state.XP_Tracker.Config.SessionOpen) {
            return (false);
        };

        state.XP_Tracker.Config.SessionOpen = false;

        if (CharIds.length > 0) {
            CharIds.forEach(function (CharId) {
                if (state.XP_Tracker.PoolIDs[CharId].SessionXP) {

                    state.XP_Tracker.PoolIDs[CharId].CurrXP = parseInt(state.XP_Tracker.PoolIDs[CharId].SessionXP) + parseInt(state.XP_Tracker.PoolIDs[CharId].CurrXP);

                    if (!(state.XP_Tracker.PoolIDs[CharId].SessionXP in Players_Report)) {
                        Players_Report[state.XP_Tracker.PoolIDs[CharId].SessionXP] = [];
                    }
                    Players_Report[state.XP_Tracker.PoolIDs[CharId].SessionXP].push(CharId);

                    state.XP_Tracker.PoolIDs[CharId].SessionXP = 0;

                    AddXPtoCharSheet(CharId, state.XP_Tracker.PoolIDs[CharId].CurrXP);
                }
            });

            for (var key in Players_Report) {
                GenerateReport('', key, Players_Report[key]);
            }
        }
    };

    // Registers Roll20 event handlers.
    //  Input: Object (Roll20_msg)
    //  Output: None
    var EventHandler = function EventHandler() {

        DebugMessage.apply(this, arguments);

        on('chat:message', ChatHandler);
        on("change:character:archived", CharacterAchived);

        //DebugEnalbed && DebugMessage('Exiting function');
    };

    //
    //
    //
    var GenerateReport = function GenerateReport(Message, XP, CharIds) {

        var Report,
            Players_Name = [],
            Leveled_Up = [],
            HTML = new HTMLScripter();

        if (!(CharIds = CheckIdsVariable(CharIds))) {
            SendChat(Trans.Add_XP_To_Ids_No_ID_Error);
            return (false);
        }

        if (CharIds.length > 0) {
            CharIds.forEach(function (CharId) {

                Players_Name.push(state.XP_Tracker.PoolIDs[CharId].Name);

                if (CheckForLevelUp(CharId)) {
                    Leveled_Up.push(state.XP_Tracker.PoolIDs[CharId].Name);
                }
            });
        }

        if ((typeof Players_Name !== 'undefined') && (Players_Name.length)) {
            if (Players_Name.length == 1) {
                Report = Players_Name[0] + Trans.Single_Player_Adv;
            }
            else if (Players_Name.length > 1) {
                Report = Players_Name.join(', ') + Trans.Multi_Player_Adv;
            }

            Report += Trans.Received + XP + Trans.XP_Each_Message;

            if (Leveled_Up.length == 1) {
                Report += Trans.And + Players_Name[0] + Trans.Single_Player_Adv + HTML.build('span', Trans.Level_Up, {
                    style: Style_CSS.span
                });
            }
            else if (Leveled_Up.length > 1) {
                Report += Trans.And + Players_Name.join(', ') + Trans.Multi_Player_Adv + HTML.build('span', Trans.Level_Up, { style: Style_CSS.span });
            }
            Report += '.';
        }
//        if ((!state.XP_Tracker.Config.TrackBySession) || (!state.XP_Tracker.Config.SessionOpen)) {
            ReportLog(Report);
//        }
    };

    // The function finds attributes object by the object Id and the attributes name.
    //  Input: String (Id), String (AttrName)
    //  Output: Object (AttrObj) or null if not found
    var GetAttrObjectByName = function GetAttrObjectByName(CharId, AttrName) {

        DebugMessage.apply(this, arguments);

        var AttrObj = findObjs({ type: 'attribute', characterid: CharId, name: AttrName });
        return AttrObj && AttrObj.length > 0 ? AttrObj[0] : null;
    };

    // This function takes a Roll20 character object Id string and returns the character object.
    //  Input: String (Id {Roll20 Object Id String})
    //  Output: Object (Character Object) 
    var GetCharacterObj = function GetCharacterObj(CharId) {

        DebugMessage.apply(this, arguments);

        var Obj = findObjs({ type: 'character', _id: CharId })[0];

        return (Obj);
    };

    // This function takes a Roll20 character object Id string and returns object with the name of the character, its current XP and the XP it needs to reach its next level.
    //  Input: String (Id {Roll20 Object Id String})
    //  Output: Object {name, XP, XPNextLevel}
    var GetCharCurrentXP = function GetCharCurrentXP(CharIds) {

        DebugMessage.apply(this, arguments);

        var result = {},
            CurrXP,
            XPNextLevel;

        if (!(CharIds = CheckIdsVariable(CharIds))) {
            return (false);
        }

        if (CharIds.length) {
            CharIds.forEach(function (CharId) {
                if (IfAttrExists(CharId, state.XP_Tracker.Config.CharSheet.PC_XP_Attr)) {
                    CurrXP = getAttrByName(CharId, state.XP_Tracker.Config.CharSheet.PC_XP_Attr, "current");
                }
                else {
                    CurrXP = 0;
                    if (state.XP_Tracker.Config.UpdateCharacterSheet) {
                        SetAttrCurrentValueByName(CharId, state.XP_Tracker.Config.CharSheet.PC_XP_Attr, CurrXP);
                    }
                }
                if (IfAttrExists(CharId, state.XP_Tracker.Config.CharSheet.XP_Next_Level_Attr)) {
                    XPNextLevel = getAttrByName(CharId, state.XP_Tracker.Config.CharSheet.XP_Next_Level_Attr, "current");
                }
                else {
                    XPNextLevel = GetXPNextLevel(CurrXP);
                    if (state.XP_Tracker.Config.UpdateCharacterSheet) {
                        SetAttrCurrentValueByName(CharId, state.XP_Tracker.Config.CharSheet.XP_Next_Level_Attr, XPNextLevel);
                    }
                }
                result[CharId] = {
                    CurrXP: CurrXP,
                    Name: GetCharNameById(CharId),
                    XPNextLevel: XPNextLevel
                };
            });
        }

        return (result);
    };

    // The function takes a character ID and returns the character name.
    //  Input: Character Id
    //  Output: Character Name or null if no name was found.
    var GetCharNameById = function GetCharNameById(id) {

        DebugMessage.apply(this, arguments);

        var obj = GetCharacterObj(id);
        if (obj === null) {
            return (null);
        }
        return (obj.attributes.name);
    };

    // This function will connect to the handout in found in state.XP_Tracker.Config.HandoutName or if it is not found it will call CreateHandoutLog () to create a new one
    //  Input: None
    //  Output: Roll20 Handout Object 
    var GetHandout = function GetHandout() {

        DebugMessage.apply(this, arguments);

        var HandoutObj = GetObject('handout', state.XP_Tracker.Config.HandoutName);

        if (HandoutObj) {
            return (HandoutObj);
        }
        else {
            return (CreateHandoutLog());
        }
    };

    // Returns the id of the XP_Tracker Log handout.
    //  Input: None
    //  Output: String (Roll20 Object Id String)
    var GetHandoutID = function GetHandoutID() {
        var HandoutObj = GetObject('handout', state.XP_Tracker.Config.HandoutName);

        return (HandoutObj.get('_id'));
    }

    // This function will connect to the handout in found in state.XP_Tracker.Config.HandoutName or if it is not found it will call CreateHandoutLog () to create a new one
    //  Input: None
    //  Output: Roll20 Handout Object 
    var GetMacro = function GetMacro() {

        DebugMessage.apply(this, arguments);

        var MacroObj = GetObject('macro', Trans.Macro_Token_to_Pool_Name);

        if (MacroObj) {
            return (MacroObj);
        }
        else {
            return (CreateMacro());
        }
    };

    // This function will provide a array of Roll20 Game Masters for the campaign.
    //  InputL None
    //  Output: Array of Roll20 Player Ids
    var GetGMs = function GetGMs() {
 
        let players = findObjs({
            _type: 'player'
        });
        let GMs = _.filter(players, player => {
            return playerIsGM(player.get('_id'));
        });

        return (GMs);
     };

    // This function will search for a Roll20 object based on the type and name and return or null if not found.
    //  Input: Roll20 Object Type, Object Name
    //  Output: Roll20 Object or NULL

    var GetObject = function GetObject(Type, Name) {

        DebugMessage.apply(this, arguments);

        var Roll20Obj = filterObjs(function (Obj) {
            return (Obj.get('_type') === Type && Obj.get('name') === Name);
        })[0];

        if (Roll20Obj) {
            return (Roll20Obj);
        }
        else {
            return (null);
        }
    };

    // This function takes a Roll20 character object Id string and returns XP value of the NPC.
    //  Input: String (Id {Roll20 Object Id String})
    //  Output: Number
    var GetNPCXP = function GetNPCXP(CharID) {

        DebugMessage.apply(this, arguments);

        var xp = null,
            AttrToCheck = ['xp', 'npc_xp', 'challenge', 'npc_challenge'],
            AttrCurrentValue ;

        AttrToCheck.forEach(function (AttrName) {
            if (IfAttrExists(CharID, AttrName)) {
                AttrCurrentValue = getAttrByName(CharID, AttrName, 'current');
                if (AttrCurrentValue !== null) {
                    if ((AttrName == 'npc_challenge') || (AttrName == 'challenge')) {
                        xp = ChallengeRatingTable5e[AttrCurrentValue];
                    }
                    else {
                        xp = AttrCurrentValue;
                    }
                    return (xp);
                }
            }
        });
        return (xp);
    };

    // This function takes a Roll20 character object Id string and an attribute name string.  It check to see if the attribute exists and returns the existing object or creates a new attribute and returns that object.
    //  Input: String (Id {Roll20 Object Id String}), String (Attribute Name)
    //  Output: Roll20 Object to new or existing Attribute
    var GetOrCreateAttr = function GetOrCreateAttr(CharID, AttrName) {

        DebugMessage.apply(this, arguments);

        if (IfAttrExists(CharID, AttrName)) {
            return (findObjs({ type: 'attribute', characterid: CharID, name: AttrName })[0]);
        }
        else {
            return (createObj('attribute', { name: AttrName, characterid: CharID }));
        }
    };

    // This function finds the members of the XP Pool and returns object with the name of the character, its current XP and the XP it needs to reach its next level.
    //  Input: none
    //  Output: Object {name, XP, XPNextLevel}
    var GetPoolCurrentXP = function GetPoolCurrentXP() {

        DebugMessage.apply(this, arguments);

        var result = GetCharCurrentXP(GetPoolMemberIDs());

        return (result);
    };

    // The function returns a list if character IDs stored in the state.XP_Tracker.PoolIDs
    //  Input: None 
    //  Output: Array = Containing Characters IDs from state.XP_Tracker.PoolIDs
    var GetPoolMemberIDs = function GetPoolMemberIDs() {

        DebugMessage.apply(this, arguments);

        if ('undefined' !== typeof state.XP_Tracker.PoolIDs) {
            return (Object.getOwnPropertyNames(state.XP_Tracker.PoolIDs));
        }
        return ('');
    };

    // This function returns the number of members of the XP Pool.
    //  Input: None
    //  Output: Number
    var GetPoolSize = function GetPoolSize() {

        DebugMessage.apply(this, arguments);

        return (GetPoolMemberIDs().length);

    };

    // Thus function generates a date/time string in UTC
    // Input: None
    // Output: String = date/time UTC
    var GetTimeStamp = function GetTimeStamp() {

        DebugMessage.apply(this, arguments);

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

        return (datestamp);
    };

    // The functions returns a array containing character IDs form the current selected tokens that are non-NPC characters.
    //  Input: Object Roll20_msg
    //  Output: Array of Strings
    var GetTokenCharID = function GetTokenCharID(Roll20_msg) {

        DebugMessage.apply(this, arguments);

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
                }
            });
        }

        return (CharID);
    };

    // The functions returns a array of Token Id and the Character ID they represent form the current selected tokens that are only NPC characters.
    //  Input: Object Roll20_msg
    //  Output: Array objects containing {TokenID, CharID}
    var GetTokenNPCID = function GetTokenNPCID(Roll20_msg) {

        DebugMessage.apply(this, arguments);

        var NPCIdObjArray = [],
            i = 0,
            CharObj;

        if (typeof Roll20_msg.selected !== 'undefined') {
            _.each(Roll20_msg.selected, function (Obj) {
                CharObj = getObj(Obj._type, Obj._id);
                if (('undefined' !== typeof CharObj.attributes.represents) && (CharObj.attributes.represents !== "")) {
                    if (IsNPC(CharObj.attributes.represents)) {
                        NPCIdObjArray[i++] = {
                            TokenID: Obj._id,
                            CharID: CharObj.attributes.represents
                        };
                    }
                }
            });
        }
        return (NPCIdObjArray);
    };

    //
    //
    //
    var GetXPNextLevel = function GetNextLevel(CurrXP) {

        DebugMessage.apply(this, arguments);

        var Level;

        for (Level in DandD5eLevelTable) {
            if (CurrXP >= DandD5eLevelTable[Level]) { }
            else {
                return (DandD5eLevelTable[Level]);
            }
        }
        return (false);
    };

    // The functions returns a true if the given attribute name was found in the object Id provided otherwise it returns false.
    //  Input: String Object ID, String Attribute Name
    //  Output: Boolean (True if the Attribute Name was found on the character or false.
    var IfAttrExists = function IfAttrExists(id, AttrName) {

        DebugMessage.apply(this, arguments);

        if ((findObjs({ _characterid: id, name: AttrName, type: 'attribute' })[0])) {
            return (true);
        }
        return (false);
    };

    // This function uses a Roll20 character Id string to see if the id is a member of the XPPool.  
    //  Input: String (Id {Roll20 Object Id String})
    //  Output: Boolean (true if the character is the pool. else false)
    var IsMember = function IsMember(CharID) {

        DebugMessage.apply(this, arguments);

        if (typeof state.XP_Tracker.PoolIDs[CharID] !== 'undefined') {
            return (true);
        }
        return (false);
    };

    // This function uses a Roll20 character Id string to look at a character to determine if it is a NPC or not.  By default it considers all 
    // characters are not NPC but if it finds a known Attribute that denotes it as a NPC if returns true
    //  Input: String (Id {Roll20 Object Id String})
    //  Output: Boolean (true if the character is an NPC. else false)
    var IsNPC = function IsNPC(CharID) {

        DebugMessage.apply(this, arguments);

        if (GetCharacterObj(CharID).get("controlledby") === "") {
            return (true);
        }
        else {
            return (false);
        }
    };

    //This function adds a character ID entries to the state.XP_Tracker.PoolIDs
    //  Input: String = Containing one Roll20 Character ID
    //  Output True if id was added false otherwise.
    var RemoveIdFromXPPool = function RemoveIdFromXPPool(id) {

        DebugMessage.apply(this, arguments);

        if (typeof state.XP_Tracker.PoolIDs[id] !== 'undefined') {
            delete state.XP_Tracker.PoolIDs[id];
            return (true);
        }
        return (false);
    };

    //The function removes one or more ids to the XP_tracker pool if they are already a member
    //  Input: String or Array of strings = one of more Roll20 character IDs
    //  Output true if player was removed from the pool false otherwise
    //      Report changes campaign chat.  And, if handout logging is enabled it will log added characters.

    var RemoveIdsFromXPPool = function RemoveIdsFromXPPool(CharIds) {

        DebugMessage.apply(this, arguments);

        var RemovedPlayers = [],
            i = 0;
        if (!(CharIds = CheckIdsVariable(CharIds))) {
            CreateButton(Trans.Remove_Ids_From_XP_Pool_None_Removed_Message);
            return (false);
        }

        if (CharIds.length > 0) {
            CharIds.forEach(function (CharId) {
                if (CharId in state.XP_Tracker.PoolIDs) {
                    RemovedPlayers[i++] = state.XP_Tracker.PoolIDs[CharId].Name;
                    RemoveIdFromXPPool(CharId);
                }
            });
        }

        if (RemovedPlayers.length == 1) {
            CreateButton(RemovedPlayers[0] + Trans.Single_Player_Adv + Trans.Remove_Ids_From_XP_Pool_Removed_Message);
            return (true);
        }
        else if (RemovedPlayers.length > 1) {
            CreateButton(RemovedPlayers.join(', ') +Trans.Multi_Player_Adv +Trans.Remove_Ids_From_XP_Pool_Removed_Message);
            return (true);
        }
        return (false);
    };

    // Remove selected tokens of non-NPC characters to the state.XP_Tracker.PoolIDs
    //  Input: Roll20_msg object
    //  Output: None
    var RemoveTokenFromXPPool = function RemoveTokenFromXPPool(Roll20_msg) {

        DebugMessage.apply(this, arguments);

        RemoveIdsFromXPPool(GetTokenCharID(Roll20_msg));
    };

    // This function will rename the handout used to track XP Changes
    //  Input: String
    //  Output: None
    var RenameHandout = function RenameHandout(Name) {

        var HandoutObj = GetHandout();

        HandoutObj.set('name', Name);
        state.XP_Tracker.Config.HandoutName = Name;
    }

    //
    //
    //
    var ReportLog = function ReportLog(Log) {

        if (state.XP_Tracker.Config.TrackInHandout) {
            WriteToHandoutLog(Log);
        }

        SendChat(Log, true);

        DebugMessage.apply(this, arguments);

    };

    // This function send a message to the campaigns chat window from XP_tracker
    //  Input: String = message to send
    //  Output: None
    var SendChat = function SendChat(output_msg, SendToAll) {

        DebugMessage.apply(this, arguments);

        SendToAll = (typeof SendToAll !== 'undefined') ? SendToAll : false;

        if (!SendToAll) {
            output_msg = '/w GM ' + output_msg;
        }
        sendChat(Trans.XP_Tracker_Header, output_msg);
    };

    // This function send a message to the campaigns chat window from XP_tracker and if TrackInHandout is true it will update the handout log as well.
    //  Input: String = message to send
    //  Output: None
    var SendLog = function SendLog(output_msg) {

        DebugMessage.apply(this, arguments);

        if (!state.XP_Tracker.Config.OnlyTrackInHandout) {
            sendChat(Trans.XP_Tracker_Header, output_msg);
        }
        if (state.XP_Tracker.Config.TrackInHandout) {
            WriteToHandoutLog(output_msg);
        }
    };

    // The function is called when the API starts and XP is stored in the SessionXP for a character.  The function will ask the GM if they want to end the session.
    //  Input: None
    //  Output: None
    var SessionOpenAtStart = function SessionOpenAtStart() {
        CreateButton(Trans.Open_Session, Trans.Yes_Button_Name, COMMAND_END_SESSION);
    };

    // The next two functions takes a Roll20 object Id string, an attribute name string and a value and update or create the attribute in the character sheet.  
    // The first function updates the current field the second one updates the max field.
    //  Input: String (Id {Roll20 Object Id String}), String (AttrName), String (Value to set)
    //  Output: none
    var SetAttrCurrentValueByName = function SetAttrCurrentValueByName(id, AttrName, value) {

        DebugMessage.apply(this, arguments);

        GetOrCreateAttr(id, AttrName).set('current', value);
    };
    var SetAttrMaxValueByName = function SetAttrMaxValueByName(id, AttrName, value) {

        DebugMessage.apply(this, arguments);

        GetOrCreateAttr(id, AttrName).set('max', value);
    };

    //
    //
    //
    var SetCharacterSheet = function SetCharacterSheet(CharSheet) {

        DebugMessage.apply(this, arguments);

        if (CharSheet === null) {
            AskForSheet();
            return (false);
        }
        else if (CharSheet in SupportedCharacterSheetLayouts) {
            state.XP_Tracker.Config.CharSheet.Name = CharSheet;
            state.XP_Tracker.Config.CharSheet.PC_XP_Attr = SupportedCharacterSheetLayouts[CharSheet].PC_XP;
            state.XP_Tracker.Config.CharSheet.NPC_XP_Attr = SupportedCharacterSheetLayouts[CharSheet].NPC_XP;
            state.XP_Tracker.Config.CharSheet.ChallengeRating = SupportedCharacterSheetLayouts[CharSheet].ChallengeRating;
            state.XP_Tracker.Config.CharSheet.XP_Next_Level_Attr = SupportedCharacterSheetLayouts[CharSheet].XP_Next_Level;
            return (true);
        }
    };

    // Need to work on this function...
    //  Input: None
    //  Output: None
    var ShowHelp = function ShowHelp() {

        DebugMessage.apply(this, arguments);

        var output_msg = '';

                //output_msg = '<div style="background-color: white; font-size:85%;"> \
                //<table border="1" cellspacing="0"; cellpadding="0"; width="100%";> \
                //    <tbody> \
                //        <tr> \
                //            <th colspan="2">!xp_tracker usage</th> \
                //        </tr> \
                //        <tr> \
                //            <td><a style="background-color: #FFF400;"><b>--help</b></a></td> \
                //        </tr> \
                //        <tr> \
                //            <td><a>Shows this help message.</a></td> \
                //        </tr> \
                //        <tr> \
                //            <td><a style="background-color: #FFF400;"><b>--addtoken</b></a></td> \
                //        </tr> \
                //        <tr> \
                //            <td><a>Adds the selected non-NPC tokens to the XP Pool.</a></td> \
                //        </tr> \
                //        <tr> \
                //            <td><a style="background-color: #FFF400;"><b>--list</b></a></td> \
                //        </tr> \
                //        <tr> \
                //            <td><a>Lists the current members of the XP Pool and provides buttons to add XP or remove any one of them.</a></td> \
                //        </tr> \
                //        <tr> \
                //            <td><a style="background-color: #FFF400;"><b>--removetoken</b></a></td> \
                //        </tr> \
                //        <tr> \
                //            <td><a>Removes the selected non-NPC tokens to the XP Pool.</a></td> \
                //        </tr> \
                //        <tr> \
                //            <td><a style="background-color: #FFF400;"><b>--xptotoken [XP]</b></a></td> \
                //        </tr> \
                //        <tr> \
                //            <td><a>The XP value provided will be split equally between the selected non-NPC Characters.</a></td> \
                //        </tr> \
                //        <tr> \
                //            <td><a style="background-color: #FFF400;"><b>--xptopool [XP]</b></a></td> \
                //        </tr> \
                //        <tr> \
                //            <td><a>The XP value provided will be split equally between the members of the XP Pool.</a></td> \
                //        </tr> \
                //        <tr> \
                //            <td><a style="background-color: #FFF400;"><b>--xpfromtoken</b></a></td> \
                //        </tr> \
                //        <tr> \
                //            <td><a>The XP value of the selected tokens will be split equally between the members of the XP Pool.</a></td> \
                //        </tr> \
                //    </tbody> \
                //</table> \
                //</div>';
        SendChat(output_msg);
    };

    // This function will show the settings page.
    //  Input: None
    //  Output: None
    var ShowSettings = function ShowSettings() {

        DebugMessage.apply(this, arguments);

        var HTML = new HTMLScripter(),
            CharIds = GetPoolMemberIDs(),
            output_msg,
            TableRow,
            Button;

        TableRow = HTML.build('td', Trans.Setting_Page_Header, { style: Style_CSS.td_header, colspan: '2' });
        output_msg = HTML.build('tr', TableRow, { style: Style_CSS.tr });

        TableRow = HTML.build('td', Trans.Track_In_Handout_Name, { style: Style_CSS.td_text, title: Trans.Track_In_Handout_Help }) + HTML.build('td', ToggleButton(state.XP_Tracker.Config.TrackInHandout, COMMAND_TOGGLE_TRACK_IN_HANDOUT), { style: Style_CSS.td_button, title: Trans.Track_In_Handout_Help });
        output_msg += HTML.build('tr', TableRow, { style: Style_CSS.tr });

        if (state.XP_Tracker.Config.TrackInHandout) {

            TableRow = HTML.build('td', Trans.Handout_Name, { style: Style_CSS.td_text }) + HTML.build('td', HTML.build('a', '[' + state.XP_Tracker.Config.HandoutName + ']', { href: HANDOUT_JOURNAL_LINK + GetHandoutID () }), { style: Style_CSS.td_right });
            output_msg += HTML.build('tr', TableRow, { style: Style_CSS.tr_top });
            TableRow = HTML.build('td', HTML.build('a', Trans.Rename_Handout_Name, { style: Style_CSS.a_renamebutton, href: Trans.Rename_Handout_Marco, title: Trans.Rename_Handout_Help }), { style: Style_CSS.td_button, colspan: '2', title: Trans.Rename_Handout_Help });
            output_msg += HTML.build('tr', TableRow, { style: Style_CSS.tr_bottom });

        }

        TableRow = HTML.build('td', Trans.Update_Character_Sheet_Name, { style: Style_CSS.td_text, title: Trans.Update_Character_Sheet_Help }) + HTML.build('td', ToggleButton(state.XP_Tracker.Config.UpdateCharacterSheet, COMMAND_TOGGLE_UPDATE_CHARACTER_SHEET), { style: Style_CSS.td_button, title: Trans.Update_Character_Sheet_Help });
        output_msg += HTML.build('tr', TableRow, { style: Style_CSS.tr });

        if (state.XP_Tracker.Config.UpdateCharacterSheet) {

            TableRow = HTML.build('td', Trans.Current_Sheet_Name, { style: Style_CSS.td_text }) + HTML.build('td', HTML.build('a', state.XP_Tracker.Config.CharSheet.Name, { }), { style: Style_CSS.td_right });
            output_msg += HTML.build('tr', TableRow, { style: Style_CSS.tr_top });
            TableRow = HTML.build('td', HTML.build('a', Trans.Change_Sheet_Button, { style: Style_CSS.a_renamebutton, href: Trans.Character_Sheet_Marco, title: Trans.Change_Sheet_Help }), { style: Style_CSS.td_button, colspan: '2', title: Trans.Change_Sheet_Help });
            output_msg += HTML.build('tr', TableRow, { style: Style_CSS.tr_bottom });

        }

        TableRow = HTML.build('td', Trans.Track_By_Session_Name, { style: Style_CSS.td_text, title: Trans.Track_By_Session_Help }) + HTML.build('td', ToggleButton(state.XP_Tracker.Config.TrackBySession, COMMAND_TOGGLE_TRACK_BY_SESSION), { style: Style_CSS.td_button, title: Trans.Track_By_Session_Help });
        output_msg += HTML.build('tr', TableRow, { style: Style_CSS.tr });

        TableRow = HTML.build('td', Trans.Remove_Archived_Name, { style: Style_CSS.td_text, title: Trans.Remove_Archived_Help }) + HTML.build('td', ToggleButton(state.XP_Tracker.Config.RemoveArchived, COMMAND_TOGGLE_REMOVE_ARCHIVED), { style: Style_CSS.td_button, title: Trans.Remove_Archived_Help });
        output_msg += HTML.build('tr', TableRow, { style: Style_CSS.tr });

        TableRow = HTML.build('td', HTML.build('a', Trans.Back_Button, { style: Style_CSS.a_backbutton, href: COMMAND_BASE }), { style: Style_CSS.td_button, colspan: '2' });
        output_msg += HTML.build('tr', TableRow, { style: Style_CSS.tr_bottom });

        output_msg = HTML.build('tbody', output_msg, {});
        output_msg = HTML.build('table', output_msg, { style: Style_CSS.table });

        output_msg = AddOutputHeader(output_msg);
        SendChat(output_msg);
    };

    //
    //
    //
    var ToggleButton = function ToggleButton(Status, Link) {

        var HTML = new HTMLScripter(),
            output_msg;

        if (Status) {
            output_msg = HTML.build('a', Trans.Enabled, { style: Style_CSS.a_enabled, href: Link });
        }
        else {
            output_msg = HTML.build('a', Trans.Disabled, { style: Style_CSS.a_disabled, href: Link });
        }

        return (output_msg);
    }

    // Toggles a boolean configuration switch.
    //  Input: Boolean 
    //  Output: Boolean
    var ToggleConfiguration = function ToggleConfiguration(Bool_Value) {
        log('Bool_Value = ' + Bool_Value);
        return (!Bool_Value);
    }

    // Toggles the TrackBySession configuration switch.
    //  Input: Boolean
    //  Output: Boolean
    var ToggleTrackBySession = function ToggleTrackBySession(Bool_Value) {
        if (state.XP_Tracker.Config.SessionOpen) {
            CreateButton(Trans.Open_Session, Trans.Yes_Button_Name, COMMAND_END_SESSION);
        }
        return (!Bool_Value);
    }

    // This function will append to the handout log
    //  Input: String = message to send
    //  Output: None
    var WriteToHandoutLog = function WriteToHandoutLog(output_msg) {

        DebugMessage.apply(this, arguments);

        var HandoutObj = GetHandout();

        HandoutObj.get('notes', function (Notes) {

            if (Notes.indexOf('</tbody></table>')) {
                Notes = Notes.slice(0, Notes.indexOf('</tbody></table>'));
            }
            Notes = Notes + '<tr><td>' + GetTimeStamp() + '</td><td>' + output_msg + '</td></tr></tbody></table>';

            setTimeout(function () {
                HandoutObj.set('notes', Notes);
            }, 10);

        });
    };

    return {
        CheckInstalled: CheckInstaller,
        RegisterEventHandlers: EventHandler
    };

})();