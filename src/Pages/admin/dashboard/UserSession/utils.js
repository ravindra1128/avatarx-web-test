export const prepareInviteMessage = (
  user = "",
  drName = "",
  shortUrl = "https://theavatarx.com/invite"
) => {
  return `Hello ${user?.first_name},

Dr. ${
    drName.split(" ")
  }'s office invites you to securely submit your vitals for our records by clicking this link: ${shortUrl}

Please follow the instructions:
- Sit comfortably and relax
- Keep face still within range, breathe evenly and avoid talking
- Make sure device is stable and environment is well lit

Stay healthy!
Thank you!

To stop receiving these messages, reply STOP.
Msg&Data rates may apply.`;
};
