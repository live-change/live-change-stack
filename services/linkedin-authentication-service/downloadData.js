import App from '@live-change/framework'
const app = App.app()
import definition from './definition.js'

export async function downloadData(user, data, { trigger, triggerService }) {
  console.log("download data", { user, data })
  const res = await trigger({ type: 'setIdentification' }, {
    sessionOrUserType: 'user_User',
    sessionOrUser: user,
    overwrite: false,
    name: data.name,
    givenName: data.given_name,
    firstName: data.given_name,
    familyName: data.family_name,
    lastName: data.family_name,
  })
  //console.log("IDENTIFICATION SET!", res)
  if(data.picture) {
    //console.log("WILL DOWNLOAD PICTURE", data.picture)
    const downloadAndUpdateImage = (async () => {
      //console.log("DOWNLOAD PICTURE", data.picture)
      const image = await triggerService({ service: 'image', type: "createImageFromUrl"  }, {
        ownerType: 'user_User',
        owner: user,
        name: "linkedin-profile-picture",
        purpose: "users-updatePicture-picture",
        url: data.picture,
        cropped: true
      })
      //console.log("IMAGE DOWNLOADED", picture)
      await trigger({ type: 'setIdentification' }, {
        sessionOrUserType: 'user_User',
        sessionOrUser: user,
        overwrite: false,
        image
      })
    })
    downloadAndUpdateImage()
  }
  if(data.email_verified) {
    await trigger({ type: 'connectEmail' }, {
      email: data.email,
      user
    })
  }
}