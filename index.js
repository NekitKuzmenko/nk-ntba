const fs = require('fs');
const Stream = require('stream');
const https = require('https');

var symbols = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

function rand(min, max) {
    return (Math.round(Math.random() * (max-min)) + min);
}

function BOT(token) {
    
    const events = {
        'message': false,
        'edited_message': false,
        'channel_post': false,
        'edited_channel_post': false,
        'inline_query': false,
        'chosen_inline_result': false,
        'callback_query': false,
        'shipping_query': false,
        'pre_checkout_query': false,
        'poll': false,
        'poll_answer': false,
        'my_chat_member': false,
        'chat_member': false,
        'chat_join_request': false,
        'reply_to_message': false
    };

    const message_types = {
        'text': false,
        'animation': false,
        'audio': false,
        'channel_chat_created': false,
        'contact': false,
        'delete_chat_photo': false,
        'dice': false,
        'document': false,
        'game': false,
        'group_chat_created': false,
        'invoice': false,
        'left_chat_member': false,
        'location': false,
        'migrate_from_chat_id': false,
        'migrate_to_chat_id': false,
        'new_chat_member': false,
        'new_chat_photo': false,
        'new_chat_title': false,
        'passport_data': false,
        'photo': false,
        'pinned_message': false,
        'poll': false,
        'sticker': false,
        'successful_payment': false,
        'supergroup_chat_created': false,
        'video': false,
        'video_note': false,
        'voice': false,
        'voice_chat_started': false,
        'voice_chat_ended': false,
        'voice_chat_participants_invited': false,
        'voice_chat_scheduled': false,
        'message_auto_delete_timer_changed': false,
        'chat_invite_link': false,
        'chat_member_updated': false
    };

    var listener;

    var lastUpdateId = 0;

    function req(path, callback, errCallback) {
        
        let opt = {
            host: 'api.telegram.org',
            port: 443,
            path: `/bot${token}/${path}`,
            method: 'POST'
        };
        
        try {
            
            let response = "";

            let req = https.request(opt, (res) => {
            
                res.setEncoding('utf8');

                res.on('data', (data) => {
                    response += data;
                });

                res.on('error', (err) => errCallback(err));
                
                res.on('end', () => {
                    callback(response);
                });

            });
            
            req.on('error', (err) => errCallback(err));
            
            req.end();

        } catch(err) {

            errCallback(err);

        }

    }


    function req_file(path, opt, callback) {

        if(opt === null) opt = {};

        try {

            var boundary = "------";

            for(var i = 0; i < rand(15, 25); i++) {

                boundary += symbols[rand(0, symbols.length)];

            }

            boundary += "----";
            
            let opts = {
                host: 'api.telegram.org',
                port: 443,
                path: `/bot${token}/${path}`,
                headers: {
                    "Content-Type": `multipart/form-data; boundary=${boundary}`
                },
                method: 'POST'
            };
            
            let response = "";
            
            let req = https.request(opts, (res) => {
                
                res.setEncoding('utf8');
    
                res.on('data', (data) => {
                    response += data;
                });
                
                res.on('end', () => {
                    if(callback !== null) callback(response);
                });
    
            });
            
            req.write(`--${boundary}\r\nContent-Disposition: form-data; name="${opt.name}"; filename="${opt.filename}"\r\nContent-Type: ${opt.content_type}\r\n\r\n`);

            req.write(fs.readFileSync(opt.path));

            req.write(`\r\n--${boundary}--\r\n`);
            
            req.on('error', (err) => {
                console.log(`nk-ntba file request error: ${err.message}`);
            });

            req.end();

        } catch(err) {
            console.error(err);
        }

    }


    async function handleUpdate(update) {
        
        let event = false;

        if('message' in update) {
            
            update = update.message;

            if(events['message'] !== false) {

                try {
                    events['message'](update);
                } catch(err) {
                    console.log(`nk-ntba handleUpdate error:\n`, err);
                }

            }
            
            for(e in message_types) {
                
                if(e in update) {
                    event = e;
                    break;
                }

            }
            
            try {
                if(event !== false && message_types[event] !== false) message_types[event](update);
            } catch(err) {
                console.log(`nk-ntba handleUpdate error:\n`, err);
            }

        } else {

            for(e in events) {

                if(e in update) {
                    event = e;
                    update = update[e];
                    break;
                }

            }

            try {
                if(event !== false && events[event] !== false) events[event](update);
            } catch(err) {
                console.log(`nk-ntba handleUpdate error:\n`, err);
            }                                    

        }

        return Promise.resolve();

    }


    async function short_polling(frequency) {

        for(;;) {

            if(!listener) break;

            await (new Promise( async (resolve) => {

                req(`getUpdates?offset=${lastUpdateId+1}`, async (res) => {

                    res = JSON.parse(res);

                    if(res.ok && res.result.length !== 0) {
                    
                        lastUpdateId = res.result[res.result.length-1].update_id;

                        for(var i = 0; i < res.result.length; i++) {

                            new Promise( (resolve) => {

                                handleUpdate(res.result[i]);

                                resolve();

                            });

                        }
                
                    } else {

                        if(!res.ok) {
                            console.error(`nk-ntba listen: error ${res.error_code}(${res.description})`);
                        }

                    }

                    resolve();
            
                }, () => {
                    
                    await (new Promise( (resolve) => { setTimeout(resolve, 1000) } ));

                    resolve();

                });

            }));

            await (new Promise( (resolve) => { setTimeout(resolve, frequency) } ));

        }

    }


    async function long_polling(timeout) {

        for(;;) {

            if(!listener) break;

            await (new Promise( async (resolve) => {

                req(`getUpdates?offset=${lastUpdateId+1}&timeout=${timeout}`, async (res) => {

                    res = JSON.parse(res);

                    if(res.ok && res.result.length !== 0) {
                    
                        lastUpdateId = res.result[res.result.length-1].update_id;

                        for(var i = 0; i < res.result.length; i++) {

                            new Promise( (resolve) => {

                                handleUpdate(res.result[i]);

                                resolve();

                            });

                        }
                
                    } else {

                        if(!res.ok) {
                            console.error(`nk-ntba listen: error ${res.error_code}(${res.description})`);
                        }

                    }

                    resolve();
            
                }, async () => {
                    
                    await (new Promise( (resolve) => { setTimeout(resolve, 1000) }));

                    resolve();

                });

            }));

        }

    }


    function send_req(path, resolve) {

        req(path, (res) => {
                
            res = JSON.parse(res);

            if(res.ok) {

                res.result.ok = res.ok;
                res = res.result;

            }
            
            resolve(res);
        
        }, (err) => console.error(`nk-ntba error`, err));

    }


    this.setCallback = function(event, callback) {
        
        if(event.startsWith('message.')) {

            event = event.substring(8, event.length);
            
            if(!event in message_types) {
                console.error(`nk-ntba setCallback(event): This message type(${event}) doesn't match with any telegram message event!`);
                return null;
            }

            message_types[event] = callback;

        } else {

            if(!event in events) {
                console.error(`nk-ntba setCallback(event): This event(${event}) doesn't match with any telegram event!`);
                return null;
            }

            events[event] = callback;

        }
        
        return true;

    }


    this.removeCallback = function(event) {

        if(event.startsWith('message.')) {

            event = event.substring(8, event.length);
            
            if(!event in message_types) {
                console.error(`nk-ntba removeCallback(event): This message type(${event}) doesn't match with any telegram message event!`);
                return null;
            }

            message_types[event] = false;

        } else {

            if(!event in events) {
                console.error(`nk-ntba removeCallback(event): This event(${event}) doesn't match with any telegram event!`);
                return null;
            }

            events[event] = false;

        }
        
        return true;

    }


    this.listen = function(opt) {
        
        if(!opt) return null;

        listener = true;

        if(opt.short_polling) {
            short_polling(opt.short_polling);
        } else

        if(opt.long_polling) {
            long_polling(opt.long_polling);
        } else {
            console.log(`nk-ntba listen error: unknown listen type!`);
        }

    }


    this.stop = function() {

        listener = false;

    }



    this.getMe = function() {

        return new Promise( (resolve) => {

            send_req('getMe', resolve);

        });

    }


    this.sendMessage = function(chat_id, text, opt) {
        
        return new Promise( (resolve) => {
            
            let path = `sendMessage?chat_id=${encodeURIComponent(chat_id)}&text=${encodeURIComponent(text)}`;

            if(opt) {

                if(opt.parse_mode) path += `&parse_mode=${encodeURIComponent(opt.parse_mode)}`;
                if(opt.reply_markup) path += `&reply_markup=${encodeURIComponent(JSON.stringify(opt.reply_markup))}`;
                if(opt.entities) path += `&entities=${encodeURIComponent(JSON.stringify(opt.entities))}`;
                if(Boolean(opt.disable_web_page_preview)) path += `&disable_web_page_preview=${opt.disable_web_page_preview}`;
                if(Boolean(opt.disable_notification)) path += `&disable_notification=${opt.disable_notification}`;
                if(Boolean(opt.protect_content)) path += `&protect_content=${opt.protect_content}`;
                if(Boolean(opt.allow_sending_without_reply)) path += `&allow_sending_without_reply=${opt.allow_sending_without_reply}`;
                if(opt.reply_to_message_id) path += `&reply_to_message_id=${opt.reply_to_message_id}`;

            }
            
            send_req(path, resolve);
        
        });
            
    }


    this.forwardMessage = function(chat_id, from_chat_id, message_id, opt) {
        
        return new Promise( (resolve) => {
        
            let path = `forwardMessage?chat_id=${encodeURIComponent(chat_id)}&from_chat_id=${from_chat_id}&message_id=${message_id}`;

            if(opt) {

                if(Boolean(opt.disable_notification)) path += `&disable_notification=${opt.disable_notification}`;
                if(Boolean(opt.protect_content)) path += `&protect_content=${opt.protect_content}`;

            }

            send_req(path, resolve);
        
        });
        
    }


    this.copyMessage = function(chat_id, from_chat_id, message_id, opt) {
        
        return new Promise( (resolve) => {
        
            let path = `copyMessage?chat_id=${encodeURIComponent(chat_id)}&from_chat_id=${encodeURIComponent(from_chat_id)}&message_id=${message_id}`;

            if(opt) {

                if(opt.caption) path += `&caption=${encodeURIComponent(opt.caption)}`;
                if(opt.parse_mode) path += `&parse_mode=${encodeURIComponent(opt.parse_mode)}`;
                if(opt.caption_entities) path += `&caption_entities=${encodeURIComponent(JSON.stringify(opt.caption_entities))}`;
                if(Boolean(opt.disable_notification)) path += `&disable_notification=${opt.disable_notification}`;
                if(Boolean(opt.protect_content)) path += `&protect_content=${opt.protect_content}`;
                if(opt.reply_to_message_id) path += `&reply_to_message_id=${opt.reply_to_message_id}`;
                if(Boolean(opt.allow_sending_without_reply)) path += `&allow_sending_without_reply=${opt.allow_sending_without_reply}`;
                if(opt.reply_markup) path += `&reply_markup=${encodeURIComponent(JSON.stringify(opt.reply_markup))}`;

            }

            send_req(path, resolve);
        
        });
        
    }


    this.sendPhoto = function(chat_id, photo, opt) {
        
        return new Promise( (resolve) => {
        
            let path = `sendPhoto?chat_id=${encodeURIComponent(chat_id)}`;

            let photo_file;

            if(fs.existsSync(photo)) photo_file = true;

            if(photo.startsWith(`http://`) || photo.startsWith(`https://`)) path += `&photo=${encodeURIComponent(photo)}`; else if(!photo_file) path += `&photo=${encodeURIComponent(photo)}`;

            if(opt) {

                if(opt.caption) path += `&caption=${encodeURIComponent(opt.caption)}`;
                if(opt.parse_mode) path += `&parse_mode=${encodeURIComponent(opt.parse_mode)}`;
                if(opt.caption_entities) path += `&caption_entities=${encodeURIComponent(JSON.stringify(opt.caption_entities))}`;
                if(Boolean(opt.disable_notification)) path += `&disable_notification=${opt.disable_notification}`;
                if(Boolean(opt.protect_content)) path += `&protect_content=${opt.protect_content}`;
                if(opt.reply_to_message_id) path += `&reply_to_message_id=${opt.reply_to_message_id}`;
                if(Boolean(opt.allow_sending_without_reply)) path += `&allow_sending_without_reply=${opt.allow_sending_without_reply}`;
                if(opt.reply_markup) path += `&reply_markup=${encodeURIComponent(JSON.stringify(opt.reply_markup))}`;

            }
            
            if(photo_file) {

                if(!opt) opt = {};

                let opts = {
                    name: 'photo',
                    path: photo,
                    filename: opt.filename || 'file.png',
                    content_type: 'image/jpeg'
                };
                
                req_file(path, opts, (res) => {
                    
                    res = JSON.parse(res);

                    if(res.ok) {

                        res.result.ok = res.ok;
                        res = res.result;

                    }

                    resolve(res);
                
                });

            } else send_req(path, resolve);
        
        });
        
    }


    this.sendAudio = function(chat_id, audio, opt) {
        
        return new Promise( (resolve) => {
        
            let path = `sendAudio?chat_id=${encodeURIComponent(chat_id)}`;

            let audio_file;

            if(fs.existsSync(audio)) audio_file = true;

            if(audio.startsWith(`http://`) || audio.startsWith(`https://`)) path += `&audio=${encodeURIComponent(audio)}`; else if(!audio_file) path += `&audio=${encodeURIComponent(audio)}`;

            if(opt) {

                if(opt.caption) path += `&caption=${encodeURIComponent(opt.caption)}`;
                if(opt.parse_mode) path += `&parse_mode=${encodeURIComponent(opt.parse_mode)}`;
                if(opt.caption_entities) path += `&caption_entities=${encodeURIComponent(JSON.stringify(opt.caption_entities))}`;
                if(opt.duration) path += `&duration=${opt.duration}`;
                if(opt.performer) path += `&performer=${encodeURIComponent(performer)}`;
                if(opt.title) path += `&title=${encodeURIComponent(title)}`;
                if(Boolean(opt.disable_notification)) path += `&disable_notification=${opt.disable_notification}`;
                if(Boolean(opt.protect_content)) path += `&protect_content=${opt.protect_content}`;
                if(opt.reply_to_message_id) path += `&reply_to_message_id=${opt.reply_to_message_id}`;
                if(Boolean(opt.allow_sending_without_reply)) path += `&allow_sending_without_reply=${opt.allow_sending_without_reply}`;
                if(opt.reply_markup) path += `&reply_markup=${encodeURIComponent(JSON.stringify(opt.reply_markup))}`;

            }

            if(audio_file) {

                let opts = {
                    name: 'audio',
                    path: audio,
                    filename: opt.filename || 'file',
                    content_type: 'audio/mpeg'
                };

                req_file(path, opts, (res) => {

                    res = JSON.parse(res);

                    if(res.ok) {

                        res.result.ok = res.ok;
                        res = res.result;

                    }

                    resolve(res);
                
                });

            } else send_req(path, resolve);
        
        });
        
    }
    
    
    this.sendDocument = function(chat_id, document, opt) {
        
        return new Promise( (resolve) => {
        
            let path = `sendDocument?chat_id=${encodeURIComponent(chat_id)}`;

            let document_file;

            if(fs.existsSync(document)) document_file = true;

            if(document.startsWith(`http://`) || document.startsWith(`https://`)) path += `&document=${encodeURIComponent(document.url)}`; else if(!document_file) path += `&document=${encodeURIComponent(document)}`;

            if(opt) {

                if(opt.caption) path += `&caption=${encodeURIComponent(opt.caption)}`;
                if(opt.parse_mode) path += `&parse_mode=${encodeURIComponent(opt.parse_mode)}`;
                if(opt.caption_entities) path += `&caption_entities=${encodeURIComponent(JSON.stringify(opt.caption_entities))}`;
                if(Boolean(opt.disable_content_type_detection)) path += `&disable_content_type_detection=${opt.disable_content_type_detection}`;
                if(Boolean(opt.disable_notification)) path += `&disable_notification=${opt.disable_notification}`;
                if(Boolean(opt.protect_content)) path += `&protect_content=${opt.protect_content}`;
                if(opt.reply_to_message_id) path += `&reply_to_message_id=${opt.reply_to_message_id}`;
                if(Boolean(opt.allow_sending_without_reply)) path += `&allow_sending_without_reply=${opt.allow_sending_without_reply}`;
                if(opt.reply_markup) path += `&reply_markup=${encodeURIComponent(JSON.stringify(opt.reply_markup))}`;

            }

            if(document_file) {

                if(!opt) opt = {};

                let opts = {
                    name: 'document',
                    path: document,
                    filename: opt.filename || 'file',
                    content_type: 'text/html'
                };

                req_file(path, opts, (res) => {

                    res = JSON.parse(res);

                    if(res.ok) {

                        res.result.ok = res.ok;
                        res = res.result;

                    }

                    resolve(res);

                });
                

            } else send_req(path, resolve);
        
        });
        
    }
    
    
    this.sendVideo = function(chat_id, video, opt) {
        
        return new Promise( (resolve) => {
        
            let path = `sendVideo?chat_id=${encodeURIComponent(chat_id)}`;

            let video_file;

            if(fs.existsSync(video)) video_file = true;

            if(video.startsWith(`http://`) || video.startsWith(`https://`)) path += `&video=${encodeURIComponent(video)}`; else if(!video_file) path += `&video=${encodeURIComponent(video)}`;
            
            if(opt) {
                
                if(opt.duration) path += `&duration=${opt.duration}`;
                if(opt.width) path += `&width=${opt.width}`;
                if(opt.height) path += `&height=${opt.height}`;
                if(opt.caption) path += `&caption=${encodeURIComponent(opt.caption)}`;
                if(opt.parse_mode) path += `&parse_mode=${encodeURIComponent(opt.parse_mode)}`;
                if(opt.caption_entities) path += `&caption_entities=${encodeURIComponent(JSON.stringify(opt.caption_entities))}`;
                if(Boolean(opt.disable_notification)) path += `&disable_notification=${opt.disable_notification}`;
                if(Boolean(opt.protect_content)) path += `&protect_content=${opt.protect_content}`;
                if(opt.reply_to_message_id) path += `&reply_to_message_id=${opt.reply_to_message_id}`;
                if(Boolean(opt.allow_sending_without_reply)) path += `&allow_sending_without_reply=${opt.allow_sending_without_reply}`;
                if(opt.reply_markup) path += `&reply_markup=${encodeURIComponent(JSON.stringify(opt.reply_markup))}`;

            }

            if(video.path) {

                let opts = {
                    name: 'video',
                    path: video,
                    filename: opt.filename || 'file',
                    content_type: 'video/mp4'
                };

                req_file(path, opts, (res) => { 
                    
                    res = JSON.parse(res);

                    if(res.ok) {

                        res.result.ok = res.ok;
                        res = res.result;

                    }

                    resolve(res);

                });

            } else send_req(path, resolve);
        
        });
        
    }
    
    
    this.sendVoice = function(chat_id, voice, opt) {
        
        return new Promise( (resolve) => {
        
            let path = `sendVoice?chat_id=${encodeURIComponent(chat_id)}`;

            let voice_file;

            if(fs.existsSync(voice)) voice_file = true;

            if(voice.startsWith(`http://`) || voice.startsWith(`https://`)) path += `&voice=${encodeURIComponent(voice)}`; else if(!voice_file) path += `&voice=${encodeURIComponent(voice)}`;

            if(opt) {
                
                if(opt.duration) path += `&duration=${opt.duration}`;
                if(opt.caption) path += `&caption=${encodeURIComponent(opt.caption)}`;
                if(opt.parse_mode) path += `&parse_mode=${encodeURIComponent(opt.parse_mode)}`;
                if(opt.caption_entities) path += `&caption_entities=${encodeURIComponent(JSON.stringify(opt.caption_entities))}`;
                if(Boolean(opt.disable_notification)) path += `&disable_notification=${opt.disable_notification}`;
                if(Boolean(opt.protect_content)) path += `&protect_content=${opt.protect_content}`;
                if(opt.reply_to_message_id) path += `&reply_to_message_id=${opt.reply_to_message_id}`;
                if(Boolean(opt.allow_sending_without_reply)) path += `&allow_sending_without_reply=${opt.allow_sending_without_reply}`;
                if(opt.reply_markup) path += `&reply_markup=${encodeURIComponent(JSON.stringify(opt.reply_markup))}`;

            }

            if(voice.path) {

                let opts;

                opts = {
                    name: 'voice',
                    path: voice,
                    filename: 'voice.mp3',
                    content_type: 'audio/mp3'
                };

                req_file(path, opts, (res) => {

                    res = JSON.parse(res);

                    if(res.ok) {

                        res.result.ok = res.ok;
                        res = res.result;

                    }

                    resolve(res);

                });

            } else send_req(path, resolve);
        
        });
        
    }


    this.sendContact = function(chat_id, phone_number, opt) {

        return new Promise( (resolve) => {

            let path = `sendContact?chat_id=${encodeURIComponent(chat_id)}&phone_number=${encodeURIComponent(phone_number)}`;

            if(opt) {

                if(opt.first_name) path += `&first_name=${opt.first_name}`;
                if(opt.last_name) path += `&last_name=${opt.last_name}`;
                if(opt.vcard) path += `&vcard=${encodeURIComponent(opt.vcard)}`;
                if(Boolean(opt.disable_notification)) path += `&disable_notification=${opt.disable_notification}`;
                if(Boolean(opt.protect_content)) path += `&protect_content=${opt.protect_content}`;
                if(opt.reply_to_message_id) path += `&reply_to_message_id=${opt.reply_to_message_id}`;
                if(Boolean(opt.allow_sending_without_reply)) path += `&allow_sending_without_reply=${opt.allow_sending_without_reply}`;
                if(opt.reply_markup) path += `&reply_markup=${encodeURIComponent(JSON.stringify(opt.reply_markup))}`;


            }

            send_req(path, resolve);

        });

    }


    this.sendPoll = function(chat_id, question, options, opt) {

        return new Promise( (resolve) => {

            let path = `sendPoll?chat_id=${encodeURIComponent(chat_id)}&question=${encodeURIComponent(question)}&options=${encodeURIComponent(options.join(','))}`;

            if(opt) {

                if(opt.is_anonymous) path += `&is_anonymous=${opt.is_anonymous}`;
                if(opt.type) path += `&type=${encodeURIComponent(opt.type)}`;
                if(opt.allows_multiple_answers) path += `&allows_multiple_answers=${opt.allows_multiple_answers}`;
                if(opt.correct_option_id) path += `&correct_option_id=${opt.correct_option_id}`;
                if(opt.explanation) path += `&explanation=${encodeURIComponent(opt.explanation)}`;
                if(opt.explanation_parse_mode) path += `&explanation_parse_mode=${opt.explanation_parse_mode}`;
                if(opt.explanation_entities) path += `&explanation_entities=${encodeURIComponent(JSON.stringify(opt.explanation_entities))}`;
                if(opt.open_period) path += `&open_period=${opt.open_period}`;
                if(opt.close_date) path += `&close_date=${opt.close_date}`;
                if(opt.is_closed) path += `&is_closed=${opt.is_closed}`;
                if(Boolean(opt.disable_notification)) path += `&disable_notification=${opt.disable_notification}`;
                if(Boolean(opt.protect_content)) path += `&protect_content=${opt.protect_content}`;
                if(opt.reply_to_message_id) path += `&reply_to_message_id=${opt.reply_to_message_id}`;
                if(Boolean(opt.allow_sending_without_reply)) path += `&allow_sending_without_reply=${opt.allow_sending_without_reply}`;
                if(opt.reply_markup) path += `&reply_markup=${encodeURIComponent(JSON.stringify(opt.reply_markup))}`;


            }

            send_req(path, resolve);

        });

    }


    this.sendDice = function(chat_id, emoji, opt) {

        return new Promise( (resolve) => {

            let path = `sendDice?chat_id=${encodeURIComponent(chat_id)}&emoji=${encodeURIComponent(emoji)}`;

            if(opt) {

                if(Boolean(opt.disable_notification)) path += `&disable_notification=${opt.disable_notification}`;
                if(Boolean(opt.protect_content)) path += `&protect_content=${opt.protect_content}`;
                if(opt.reply_to_message_id) path += `&reply_to_message_id=${opt.reply_to_message_id}`;
                if(Boolean(opt.allow_sending_without_reply)) path += `&allow_sending_without_reply=${opt.allow_sending_without_reply}`;
                if(opt.reply_markup) path += `&reply_markup=${encodeURIComponent(JSON.stringify(opt.reply_markup))}`;


            }

            send_req(path, resolve);

        });

    }


    this.sendChatAction = function(chat_id, action) {

        return new Promise( (resolve) => {

            let path = `sendChatAction?chat_id=${encodeURIComponent(chat_id)}&action=${encodeURIComponent(action)}`;

            send_req(path, resolve);

        });

    }


    this.getUserProfilePhotos = function(user_id, opt) {

        return new Promise( (resolve) => {

            let path = `sendChatAction?user_id=${encodeURIComponent(user_id)}`;

            if(opt) {

                if(opt.offset) path += `&offset=${opt.offset}`;
                if(opt.limit) path += `&limit=${opt.limit}`;

            }

            send_req(path, resolve);

        });

    }


    this.getFile = function(file_id) {

        return new Promise( (resolve) => {

            send_req(`getFile?file_id=${file_id}`, resolve);

        });

    }


    this.downloadFile = async function(file_id, output_write_stream) {

        return new Promise(async (resolve) => {

            let file_path = (await (new Promise( (resolve) => {

                req(`getFile?file_id=${file_id}`, (res) => {

                    res = JSON.parse(res);

                    resolve(res);

                }, (err) => console.error(`nk-ntba error`, err));

            }))).file_path;

            https.get(`https://api.telegram.org/file/bot${token}${file_path}`, (file) => {

                file.pipe(output_write_stream).on('close', () => { resolve() });

            });

        });

    }


    this.banChatMember = function(chat_id, user_id, opt) {
        
        return new Promise( (resolve) => {
        
            let path = `banChatMember?chat_id=${encodeURIComponent(chat_id)}&user_id=${encodeURIComponent(user_id)}`;

            if(opt) {

                if(opt.until_date) path += `&until_date=${opt.until_date}`;
                if(Boolean(opt.revoke_messages)) path += `&revoke_messages=${opt.revoke_messages}`;

            }
            
            send_req(path, resolve);
        
        });

    }


    this.unbanChatMember = function(chat_id, user_id, opt) {
        
        return new Promise( (resolve) => {
        
            let path = `unbanChatMember?chat_id=${encodeURIComponent(chat_id)}&user_id=${encodeURIComponent(user_id)}`;

            if(opt) {

                if(Boolean(opt.only_if_banned)) path += `&only_if_banned=${opt.only_if_banned}`;

            }

            send_req(path, resolve);
        
        });

    }


    this.restrictChatMember = function(chat_id, user_id, permissions, opt) {
        
        return new Promise( (resolve) => {
        
            let path = `restrictChatMember?chat_id=${encodeURIComponent(chat_id)}&user_id=${encodeURIComponent(user_id)}&permissions=${encodeURIComponent(JSON.stringify(permissions))}`;

            if(opt) {

                if(opt.until_date) path += `&until_date=${opt.until_date}`;

            }

            send_req(path, resolve);
        
        });

    }


    this.promoteChatMember = function(chat_id, user_id, opt) {
        
        return new Promise( (resolve) => {
        
            let path = `promoteChatMember?chat_id=${encodeURIComponent(chat_id)}&user_id=${encodeURIComponent(user_id)}`;

            if(opt) {

                if(Boolean(opt.is_anonymous)) path += `&is_anonymous=${opt.is_anonymous}`;
                if(Boolean(opt.can_manage_chat)) path += `&can_manage_chat=${opt.can_manage_chat}`;
                if(Boolean(opt.can_post_messages)) path += `&can_post_messages=${opt.can_post_messages}`;
                if(Boolean(opt.can_edit_messages)) path += `&can_edit_messages=${opt.can_edit_messages}`;
                if(Boolean(opt.can_delete_messages)) path += `&can_delete_messages=${opt.can_delete_messages}`;
                if(Boolean(opt.can_manage_video_chats)) path += `&can_manage_video_chats=${opt.can_manage_video_chats}`;
                if(Boolean(opt.can_restrict_members)) path += `&can_restrict_members=${opt.can_restrict_members}`;
                if(Boolean(opt.can_promote_members)) path += `&can_promote_members=${opt.can_promote_members}`;
                if(Boolean(opt.can_change_info)) path += `&can_change_info=${opt.can_change_info}`;
                if(Boolean(opt.can_invite_users)) path += `&can_invite_users=${opt.can_invite_users}`;
                if(Boolean(opt.can_pin_messages	)) path += `&can_pin_messages=${opt.can_pin_messages}`;


            }

            send_req(path, resolve);
        
        });

    }


    this.setChatAdministratorCustomTitle = function(chat_id, user_id, custom_title) {
        
        return new Promise( (resolve) => {

            send_req(`setChatAdministratorCustomTitle?chat_id=${encodeURIComponent(chat_id)}&user_id=${encodeURIComponent(user_id)}&custom_title=${encodeURIComponent(custom_title)}`, resolve);
        
        });

    }


    this.banChatSenderChat = function(chat_id, sender_chat_id) {
        
        return new Promise( (resolve) => {

            send_req(`banChatSenderChat?chat_id=${encodeURIComponent(chat_id)}&sender_chat_id=${sender_chat_id}`, resolve);
        
        });

    }


    this.unbanChatSenderChat = function(chat_id, sender_chat_id) {
        
        return new Promise( (resolve) => {

            send_req(`unbanChatSenderChat?chat_id=${encodeURIComponent(chat_id)}&sender_chat_id=${sender_chat_id}`, resolve);
        
        });

    }


    this.setChatPermissions = function(chat_id, permissions) {
        
        return new Promise( (resolve) => {

            send_req(`setChatPermissions?chat_id=${encodeURIComponent(chat_id)}&permissions=${encodeURIComponent(JSON.stringify(permissions))}`, resolve);
        
        });

    }


    this.exportChatInviteLink = function(chat_id) {
        
        return new Promise( (resolve) => {
        
            send_req(`exportChatInviteLink?chat_id=${encodeURIComponent(chat_id)}`, resolve);
        
        });

    }


    this.createChatInviteLink = function(chat_id, opt) {
        
        return new Promise( (resolve) => {
        
            let path = `createChatInviteLink?chat_id=${encodeURIComponent(chat_id)}`;

            if(opt) {

                if(opt.name) path += `&name=${encodeURIComponent(opt.name)}`;
                if(opt.expire_date) path += `&expire_date=${opt.expire_date}`;
                if(opt.member_limit)  path += `&member_limit=${opt.member_limit}`;
                if(Boolean(opt.creates_join_request)) path += `&creates_join_request=${opt.creates_join_request}`;

            }

            send_req(path, resolve);
        
        });

    }


    this.editChatInviteLink = function(chat_id, invite_link, opt) {
        
        return new Promise( (resolve) => {
        
            let path = `editChatInviteLink?chat_id=${encodeURIComponent(chat_id)}&invite_link=${encodeURIComponent(invite_link)}`;

            if(opt) {

                if(opt.name) path += `&name=${encodeURIComponent(opt.name)}`;
                if(opt.expire_date) path += `&expire_date=${opt.expire_date}`;
                if(opt.member_limit)  path += `&member_limit=${opt.member_limit}`;
                if(Boolean(opt.creates_join_request)) path += `&creates_join_request=${opt.creates_join_request}`;

            }

            send_req(path, resolve);
        
        });

    }


    this.revokeChatInviteLink = function(chat_id, invite_link) {
        
        return new Promise( (resolve) => {
        
            let path = `revokeChatInviteLink?chat_id=${encodeURIComponent(chat_id)}&invite_link=${encodeURIComponent(invite_link)}`;

            send_req(path, resolve);
        
        });

    }


    this.approveChatJoinRequest = function(chat_id, user_id) {
        
        return new Promise( (resolve) => {

            send_req(`approveChatJoinRequest?chat_id=${encodeURIComponent(chat_id)}&user_id=${encodeURIComponent(user_id)}`, resolve);
        
        });

    }


    this.declineChatJoinRequest = function(chat_id, user_id) {
        
        return new Promise( (resolve) => {

            send_req(`declineChatJoinRequest?chat_id=${encodeURIComponent(chat_id)}&user_id=${encodeURIComponent(user_id)}`, resolve);
        
        });

    }


    this.setChatPhoto = function(chat_id, photo) {
        
        return new Promise( (resolve) => {
        
            let path = `setChatPhoto?chat_id=${encodeURIComponent(chat_id)}`;

            let opts = {
                name: 'photo',
                path: photo,
                filename: 'file.jpg',
                content_type: 'image/jpeg'
            };

            req_file(path, opts, (res) => {

                res = JSON.parse(res);

                if(res.ok) {

                    res.result.ok = res.ok;
                    res = res.result;

                }

                resolve(res);

            });
        
        });

    }


    this.deleteChatPhoto = function(chat_id) {
        
        return new Promise( (resolve) => {

            send_req(`deleteChatPhoto?chat_id=${encodeURIComponent(chat_id)}`, resolve);
        
        });

    }


    this.setChatTitle = function(chat_id, title) {
        
        return new Promise( (resolve) => {

            send_req(`setChatTitle?chat_id=${encodeURIComponent(chat_id)}&title=${encodeURIComponent(title)}`, resolve);
        
        });

    }


    this.setChatDescription = function(chat_id, description) {
        
        return new Promise( (resolve) => {

            send_req(`setChatDescription?chat_id=${encodeURIComponent(chat_id)}&description=${encodeURIComponent(description)}`, resolve);
        
        });

    }


    this.pinChatMessage = function(chat_id, message_id, opt) {
        
        return new Promise( (resolve) => {
        
            let path = `pinChatMessage?chat_id=${encodeURIComponent(chat_id)}&message_id=${message_id}`;

            if(opt) {

                if(Boolean(opt.disable_notification)) path += `&disable_notification=${opt.disable_notification}`;

            }

            send_req(path, resolve);
        
        });

    }


    this.unpinChatMessage = function(chat_id, message_id) {
        
        return new Promise( (resolve) => {

            send_req(`unpinChatMessage?chat_id=${encodeURIComponent(chat_id)}&message_id=${message_id}`, resolve);
        
        });

    }


    this.unpinAllChatMessages = function(chat_id) {
        
        return new Promise( (resolve) => {

            send_req(`unpinAllChatMessages?chat_id=${encodeURIComponent(chat_id)}`, resolve);
        
        });

    }


    this.leaveChat = function(chat_id) {
        
        return new Promise( (resolve) => {

            send_req(`leaveChat?chat_id=${encodeURIComponent(chat_id)}`, resolve);
        
        });

    }


    this.getChat = function(chat_id) {
        
        return new Promise( (resolve) => {

            send_req(`getChat?chat_id=${encodeURIComponent(chat_id)}`, resolve);
        
        });

    }


    this.getChatAdministrators = function(chat_id) {
        
        return new Promise( (resolve) => {

            send_req(`getChatAdministrators?chat_id=${encodeURIComponent(chat_id)}`, resolve);
        
        });

    }


    this.getChatMemberCount = function(chat_id) {
        
        return new Promise( (resolve) => {

            send_req(`getChatMemberCount?chat_id=${encodeURIComponent(chat_id)}`, resolve);
        
        });

    }


    this.getChatMember = function(chat_id, user_id) {
        
        return new Promise( (resolve) => {

            send_req(`getChatMember?chat_id=${encodeURIComponent(chat_id)}&user_id=${encodeURIComponent(user_id)}`, resolve);
        
        });

    }


    this.setChatStickerSet = function(chat_id, sticker_set_name) {
        
        return new Promise( (resolve) => {

            send_req(`setChatStickerSet?chat_id=${encodeURIComponent(chat_id)}&sticker_set_name=${encodeURIComponent(sticker_set_name)}`, resolve);
        
        });

    }


    this.deleteChatStickerSet = function(chat_id) {
        
        return new Promise( (resolve) => {

            send_req(`deleteChatStickerSet?chat_id=${encodeURIComponent(chat_id)}`, resolve);
        
        });

    }
    
    
    this.answerCallbackQuery = function(callback_query_id, text, show_alert, opt) {
        
        return new Promise( (resolve) => {
        
            let path = `answerCallbackQuery?callback_query_id=${callback_query_id}&text=${encodeURIComponent(text)}${ Boolean(show_alert) ? `&show_alert=${show_alert}` : "" }`;

            if(opt) {

                if(opt.url) path += `&url=${encodeURIComponent(opt.url)}`;
                if(opt.cache_time) path += `&cache_time=${opt.cache_time}`;

            }

            send_req(path, resolve);
        
        });

    }


    this.answerInlineQuery = function(inline_query_id, results, opt) {
        
        return new Promise( (resolve) => {
        
            let path = `answerInlineQuery?inline_query_id=${inline_query_id}&results=${encodeURIComponent(JSON.stringify(results))}`;

            if(opt) {

                if(opt.cache_time) path += `&cache_time=${opt.cache_time}`;
                if(Boolean(opt.is_personal)) path += `&is_personal=${opt.is_personal}`;
                if(opt.next_offset) path += `&next_offset=${encodeURIComponent(opt.next_offset)}`;
                if(opt.button) path += `&button=${encodeURIComponent(JSON.stringify(opt.button))}`;

            }

            send_req(path, resolve);
        
        });

    }


    this.setMyCommands = function(commands, opt) {
        
        return new Promise( (resolve) => {
        
            let path = `setMyCommands?commands=${encodeURIComponent(JSON.stringify(commands))}`;

            if(opt) {

                if(opt.scope) path += `&scope=${encodeURIComponent(JSON.stringify(opt.scope))}`;
                if(opt.language_code) path += `&language_code=${opt.language_code}`;

            }

            send_req(path, resolve);
        
        });

    }


    this.deleteMyCommands = function(opt) {
        
        return new Promise( (resolve) => {
        
            let path = `deleteMyCommands`;

            if(opt) {

                if(opt.scope) path += `?scope=${encodeURIComponent(JSON.stringify(opt.scope))}`;
                if(opt.language_code && !opt.scope) path += `?language_code=${opt.language_code}`; else if(opt.language_code && opt.scope) path += `&language_code=${opt.language_code}`;

            }

            send_req(path, resolve);
        
        });

    }


    this.getMyCommands = function(opt) {
        
        return new Promise( (resolve) => {
        
            let path = `getMyCommands`;

            if(opt) {

                if(opt.scope) path += `?scope=${encodeURIComponent(JSON.stringify(opt.scope))}`;
                if(opt.language_code && !opt.scope) path += `?language_code=${opt.language_code}`; else if(opt.language_code && opt.scope) path += `&language_code=${opt.language_code}`;

            }

            send_req(path, resolve);
        
        });

    }


    this.setChatMenuButton = function(chat_id, menu_button) {
        
        return new Promise( (resolve) => {

            send_req(`setChatMenuButton?chat_id=${encodeURIComponent(chat_id)}&menu_button=${encodeURIComponent(JSON.stringify(menu_button))}`, resolve);
        
        });

    }


    this.getChatMenuButton = function(chat_id) {
        
        return new Promise( (resolve) => {

            send_req(`getChatMenuButton?chat_id=${encodeURIComponent(chat_id)}`, resolve);
        
        });

    }


    this.setMyDefaultAdministratorRights = function(opt) {
        
        return new Promise( (resolve) => {
        
            let path = `setMyDefaultAdministratorRights`;

            if(opt) {

                if(opt.rights) path += `?rights=${encodeURIComponent(JSON.stringify(rights))}`;
                if(Boolean(opt.for_channels) && !opt.rights) path += `?for_channels=${opt.for_channels}`; else if(Boolean(opt.for_channels) && opt.rights) path += `&for_channels=${opt.for_channels}`;

            }

            send_req(path, resolve);
        
        });

    }


    this.getMyDefaultAdministratorRights = function(opt) {

        return new Promise( (resolve) => {
        
            let path = `getMyDefaultAdministratorRights`;

            if(opt) {

                if(Boolean(opt.for_channels)) path += `?for_channels=${opt.for_channels}`;

            }

            send_req(path, resolve);
        
        });

    }


    this.editMessageText = function(text, opt) {

        return new Promise( (resolve) => {
        
            let path = `editMessageText?text=${encodeURIComponent(text)}`;

            if(opt) {

                if(opt.chat_id) path += `&chat_id=${opt.chat_id}`;
                if(opt.message_id) path += `&message_id=${opt.message_id}`;
                if(opt.inline_message_id) path += `&inline_message_id=${opt.inline_message_id}`;
                if(opt.parse_mode) path += `&parse_mode=${opt.parse_mode}`;
                if(opt.entities) path += `&entities=${encodeURIComponent(JSON.stringify(opt.entities))}`;
                if(Boolean(opt.disable_web_page_preview)) path += `&disable_web_page_preview=${opt.disable_web_page_preview}`;
                if(opt.reply_markup) path += `&reply_markup=${encodeURIComponent(JSON.stringify(opt.reply_markup))}`;

            }

            send_req(path, resolve);
        
        });

    }


    this.editMessageCaption = function(caption, opt) {

        return new Promise( (resolve) => {
        
            let path = `editMessageCaption?caption=${encodeURIComponent(caption)}`;

            if(opt) {

                if(opt.chat_id) path += `&chat_id=${opt.chat_id}`;
                if(opt.message_id) path += `&message_id=${opt.message_id}`;
                if(opt.inline_message_id) path += `&inline_message_id=${opt.inline_message_id}`;
                if(opt.parse_mode) path += `&parse_mode=${opt.parse_mode}`;
                if(opt.caption_entities) path += `&caption_entities=${encodeURIComponent(JSON.stringify(opt.caption_entities))}`;
                if(opt.reply_markup) path += `&reply_markup=${encodeURIComponent(JSON.stringify(opt.reply_markup))}`;

            }

            send_req(path, resolve);
        
        });

    }


    this.editMessageMedia = function(media, opt) {

        return new Promise( (resolve) => {
        
            let path = `editMessageCaption?type=${media.type}`;

            let opts = {};

            if(media.type === 'photo') {
                opts = {
                    name: 'photo',
                    path: media.path,
                    filename: 'file.jpg',
                    content_type: 'image/jpeg'
                };
            }

            if(media.type === 'audio') {
                opts = {
                    name: 'audio',
                    path: media.path,
                    filename: 'file.mp3',
                    content_type: 'audio/mpeg'
                };
            }

            if(media.type === 'document') {
                opts = {
                    name: 'document',
                    path: media.path,
                    filename: 'file.txt',
                    content_type: 'text/html'
                };
            }

            if(media.type === 'video') {
                opts = {
                    name: 'video',
                    path: video.path,
                    filename: 'video.mp4',
                    content_type: 'video/mpeg'
                };
            }

            if(opt) {

                if(opt.chat_id) path += `&chat_id=${opt.chat_id}`;
                if(opt.message_id) path += `&message_id=${opt.message_id}`;
                if(opt.inline_message_id) path += `&inline_message_id=${opt.inline_message_id}`;
                if(opt.reply_markup) path += `&reply_markup=${encodeURIComponent(JSON.stringify(opt.reply_markup))}`;

            }

            req_file(path, opts, (res) => {

                res = JSON.parse(res);

                if(res.ok) {

                    res.result.ok = res.ok;
                    res = res.result;

                }

                resolve(res);

            });
        
        });

    }


    this.editMessageReplyMarkup = function(reply_markup, opt) {

        return new Promise( (resolve) => {
        
            let path = `editMessageReplyMarkup?reply_markup=${encodeURIComponent(JSON.stringify(reply_markup))}`;

            if(opt) {

                if(opt.chat_id) path += `&chat_id=${opt.chat_id}`;
                if(opt.message_id) path += `&message_id=${opt.message_id}`;
                if(opt.inline_message_id) path += `&inline_message_id=${opt.inline_message_id}`;

            }

            send_req(path, resolve);
        
        });

    }


    this.stopPoll = function(chat_id, message_id, opt) {

        return new Promise( (resolve) => {

            let path = `stopPoll?chat_id=${encodeURIComponent(chat_id)}&message_id=${message_id}`;

            if(opt) {

                if(opt.reply_markup) path += `&reply_markup=${encodeURIComponent(JSON.stringify(opt.reply_markup))}`;


            }

            send_req(path, resolve);

        });

    }


    this.deleteMessage = function(chat_id, message_id) {

        return new Promise( (resolve) => {

            let path = `deleteMessage?chat_id=${encodeURIComponent(chat_id)}&message_id=${message_id}`;

            send_req(path, resolve);

        });

    }

}

module.exports = BOT;
