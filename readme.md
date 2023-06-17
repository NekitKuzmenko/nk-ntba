Bot authorization:

```
const Bot = require('nk-ntba');

let bot = new Bot('API token of your bot');
```

Events for listening updates:

    message
    edited_message
    channel_post
    edited_channel_post
    inline_query
    chosen_inline_result
    callback_query
    shipping_query'
    pre_checkout_query
    poll
    poll_answer
    my_chat_member
    chat_member
    chat_join_request
    reply_to_message

For specific types of messages:

    text
    animation
    audio
    channel_chat_created
    contact
    delete_chat_photo
    dice
    document
    game
    group_chat_created
    invoice
    left_chat_member
    location
    migrate_from_chat_id
    migrate_to_chat_id
    new_chat_member
    new_chat_photo
    new_chat_title
    passport_data
    photo
    pinned_message
    poll
    sticker
    successful_payment
    supergroup_chat_created
    video
    video_note
    voice
    voice_chat_started
    voice_chat_ended
    voice_chat_participants_invited
    voice_chat_scheduled
    message_auto_delete_timer_changed
    chat_invite_link
    chat_member_updated

To use specific types of messages in listener you should write event with prefix   ```message.```   , for example ```message.text```.

Adding a listener to some event:

```
bot.setCallback('your event', callback);
```

Removing a listener:

```
bot.removeCallback('your event');
```

Starting listener:

```
bot.start({
    short_polling: 500
});
```
or
```
bot.start({
    long_polling: 60
});
```


[About polling](https://core.telegram.org/bots/api#getupdates)

**Webhookes are not available yet.**


Stoping listener:

```
bot.stop();
```

Downloading file by ```file_id```:

```
const fs = require('fs');
const Bot = require('nk-ntba');

let bot = new Bot('API token of your bot');

await bot.downloadFile('your file_id', fs.createWriteStream('your file'));
```

All other methods are async and need ```await``` or ```.then``` constructions (```.catch``` is not used, **promise is always resolved**).
You can check available methods in source code of this library.

Example of echo bot:

```
const Bot = require('nk-ntba');

let bot = new Bot('API token of your bot');

bot.setCallback('message.text', async (msg) => {

    let cid = msg.chat.id;
    let msgid = msg.message_id;
    let tx = msg.text;

    let r = await bot.sendMessage(cid, `You sent: ${tx}`);

    setTimeout(() => {

        bot.deleteMessage(cid, msgid);
        bot.deleteMessage(cid, r.message_id);

        bot.sendMessage(cid, `Messages were deleted after 5 sec`);

    }, 5000);

});

bot.listen({
    lon_polling: 300
});
```
