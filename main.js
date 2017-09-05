$.urlParam = function (name) {
  var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href)
  if (results == null) {
    return null
  } else {
    return results[1] || 0
  }
}
var doctoload = $.urlParam('doc')
var shareddoc = $.urlParam('shareddoc')
new function ($) {
  $.fn.getCursorPosition = function () {
    var pos = 0
    var el = $(this).get(0)
    // IE Support
    if (document.selection) {
      el.focus()
      var Sel = document.selection.createRange()
      var SelLength = document.selection.createRange().text.length
      Sel.moveStart('character', -el.value.length)
      pos = Sel.text.length - SelLength
    }
    // Firefox support
    else if (el.selectionStart || el.selectionStart == '0') {
      pos = el.selectionStart
    }

    return pos
  }
}(jQuery)

new function ($) {
  $.fn.setCursorPosition = function (pos) {
    if ($(this).get(0).setSelectionRange) {
      $(this).get(0).setSelectionRange(pos, pos)
    } else if ($(this).get(0).createTextRange) {
      var range = $(this).get(0).createTextRange()
      range.collapse(true)
      range.moveEnd('character', pos)
      range.moveStart('character', pos)
      range.select()
    }
  }
}(jQuery)
$('document').ready(function (e) {
  $('#content').hide()
  $('#editor').hide()
  $('#deletedocfab').hide()
  firebase.auth().getRedirectResult().then(function (result) {
    if (result.credential) {
      // This gives you a Google Access Token. You can use it to access the Google API.
      var token = result.credential.accessToken
      // ...
    }
    // The signed-in user info.
    var user = result.user
  }).catch(function (error) {
    // Handle Errors here.
    var errorCode = error.code
    var errorMessage = error.message
    // The email of the user's account used.
    var email = error.email
    // The firebase.auth.AuthCredential type that was used.
    var credential = error.credential
    // ...
  })

  $('.logout').hide()

  $('.login').click(function (e) {
    $('#loader').show()
    firebase.auth().signInWithRedirect(provider)
  })
  $('.logout').click(function (e) {
    $('#loader').show()
    firebase.auth().signOut().then(function () {
      // Sign-out successful.
      Materialize.toast('Sign out successful', 4000)
      $('#loader').hide()
      location.reload()
    }, function (error) {
      // An error happened.
      Materialize.toast(error, 4000)
      $('#loader').hide()
    })
  })

  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      $('#newdocfab').show()
      $('.logout').show()
      $('.login').hide()
      var user = firebase.auth().currentUser
      var name, email, photoUrl, uid, emailVerified

      if (user != null) {
        username = user.displayName
        email = user.email
        photoUrl = user.photoURL
        emailVerified = user.emailVerified
        uid = user.uid
      }
      if (doctoload || shareddoc) {
        if (window.location.href.indexOf('app') > -1) {
          window.location = '/app'
        }
        fontsautocompleate = {
          data: {
            'Roboto': null,
            'Diplomata SC': null,
            'Montserrat': null

          },
          limit: 20 // The max amount of results that can be shown at once. Default: Infinity.
        }
        var fonts = []
        var fontloadRef = firebase.database().ref('docs/users/' + uid + '/fonts/')
        fontloadRef.on('child_added', function (data) {
          var currentfontname = data.val().font
          fontsautocompleate.data[currentfontname] = null

          fonts.push(data.val().font)

          console.log('auto')
        })
        $('input.autocomplete').autocomplete(fontsautocompleate)

        if (shareddoc) {
          var docloadRef = firebase.database().ref('docs/shared/docs/' + shareddoc)
          $('#deletethisdoc').hide()
          var docloadString = 'docs/shared/docs/' + shareddoc
        } else {
          var docloadRef = firebase.database().ref('docs/users/' + uid + '/docs/' + doctoload)
          var docloadString = 'docs/users/' + uid + '/docs/' + doctoload
        }

        var content

        $('#editor').show()
        $('#newdocfab').hide()
        $('#deletedocfab').show()
        var contains = function (needle) {
          // Per spec, the way to identify NaN is that it is not equal to itself
          var findNaN = needle !== needle
          var indexOf

          if (!findNaN && typeof Array.prototype.indexOf === 'function') {
            indexOf = Array.prototype.indexOf
          } else {
            indexOf = function (needle) {
              var i = -1,
                index = -1

              for (i = 0; i < this.length; i++) {
                var item = this[i]

                if ((findNaN && item !== item) || item === needle) {
                  index = i
                  break
                }
              }

              return index
            }
          }

          return indexOf.call(this, needle) > -1
        }
        $('#fontsettings').click(function () {
          var fontsize = $('#font_size').val()
          var fontcolor = $('#font_color').val()
          var fontfamily = $('#font-family').val()
          if (!fontfamily) {
            fontfamily = 'Roboto'
          }
          if (!fontcolor) {
            fontcolor = '#2B2B2B'
          }
          if (!fontsize) {
            fontsize = '20px'
          }
          WebFont.load({
            google: {
              families: [fontfamily]
            }

          })

          index = contains.call(fonts, fontfamily)
          if (!index) {
            var fontloadRef = firebase.database().ref('docs/users/' + uid + '/fonts/').push()
            fontloadRef.set({
              font: fontfamily
            })
          }

          $('#beta-editor *').css('font-family', fontfamily)
          $('#beta-editor *').css('color', fontcolor)
          $('#beta-editor *').css('font-size', fontsize)
        })
        $('.tooltipped').tooltip({
          delay: 50
        })
        $('#deletethisdoc').click(function (e) {
          var updates = {}
          updates[docloadString] = null
          firebase.database().ref().update(updates)
          window.location = 'app'
        })
        docloadRef.once('value').then(function (snapshot) {
          if (!snapshot.val()) {
            window.location = 'app'
          }
          var content = snapshot.val().content
          var name = snapshot.val().name

          var shared = snapshot.val().shared
          if (shared) {
            window.location = shared
          }
          if (shareddoc) {
            var dcrname = name
            var doctitle = 'Docs | ' + dcrname
            $('#documentname').text(dcrname)
            document.title = doctitle
            console.log(doctitle)
            var dcryptedcontent = content
          } else {
            var dcrname = blowfish.decrypt(name, uid, {
              outputType: 1,
              cipherMode: 0
            })
            var doctitle = 'Docs | ' + dcrname
            $('#documentname').text(dcrname)
            document.title = doctitle
            console.log(doctitle)
            var dcryptedcontent = blowfish.decrypt(content, uid, {
              outputType: 1,
              cipherMode: 0
            })
          }

          $('#content').fadeIn('slow')
          $('#beta-editor').focus()

          $('#confirmshare').click(function () {
            console.log('info loading')
            docloadRef.once('value').then(function (snapshot) {
              var content = snapshot.val().content
              var name = snapshot.val().name

              var shared = snapshot.val().shared
              if (shared) {
                window.location = shared
              }

              dcrname = blowfish.decrypt(name, uid, {
                outputType: 1,
                cipherMode: 0
              })

              dcryptedcontent = blowfish.decrypt(content, uid, {
                outputType: 1,
                cipherMode: 0
              })

              console.log(dcryptedcontent)
              var shareddocRef = firebase.database().ref('docs/shared/docs/').push()
              shareddocRef.set({
                name: dcrname,
                content: dcryptedcontent
              })
              firebase.database().ref('docs/shared/docs/').limitToLast(1).on('child_added', function (snapshot) {
                var dockey = snapshot.key
                console.log(dockey + ' key')
                var updates = {}
                updates['docs/users/' + uid + '/docs/' + doctoload + '/shared'] = 'app?shareddoc=' + dockey

                firebase.database().ref().update(updates)
                $('#sharelink').html('<a>rosho123.github.io/app?shareddoc=' + dockey + '</a>')
                var sharedoclink = '<a onclick="location.realod();">app?shareddoc=' + dockey + '</a>'
                console.log(sharedoclink)
                $('#sharelink').click(function () {
                  location.reload()
                })
                $('#loader-share').hide()
                console.log('app?shareddoc=' + dockey)
              })
            })
          })

          $('#beta-editor').html(dcryptedcontent)
          $('#loader').hide()
          fontfam = $('#beta-editor *').css('font-family')

          fontfam = fontfam.replace(/['"]+/g, '')
          WebFont.load({
            google: {
              families: [fontfam]
            }
          })

          $('#font-family').val(fontfam)
          $('#font_color').val($('#beta-editor *').css('color'))
          $('#font_size').val($('#beta-editor *').css('font-size'))
          $('#saved').click(function () {
            var currentcontent = $('#beta-editor').html()
            var currentname = $('#documentname').text()

            if (shareddoc) {
              var enccontnet = currentcontent
              var encname = currentname
            } else {
              var enccontnet = blowfish.encrypt(currentcontent, uid, {
                outputType: 1,
                cipherMode: 0
              })
              var encname = blowfish.encrypt(currentname, uid, {
                outputType: 1,
                cipherMode: 0
              })
            }

            var updates = {}
            updates[docloadString + '/content'] = enccontnet

            firebase.database().ref().update(updates)
            var updates = {}
            updates[docloadString + '/name'] = encname

            firebase.database().ref().update(updates)
            $('#save-text').text('Saved')
          })

          $('#beta-editor').on('keydown', function (e) {
            var thecode = e.keyCode || e.which

            if (thecode == 9) {
              e.preventDefault()
              var html = $('#beta-editor').val()
              var pos = $('#beta-editor').getCursorPosition() // get cursor position
              var prepend = html.substring(0, pos)
              var append = html.replace(prepend, '')
              var newVal = prepend + '    ' + append
              $('#beta-editor').val(newVal)
              $('#beta-editor').setCursorPosition(pos + 4)
            }
          })
        })
        docloadRef.on('value', function (snapshot) {
          content = snapshot.val().content
          name = snapshot.val().name
          setInterval(function () {
            var currentcontent = $('#beta-editor').html()

            var currentname = $('#documentname').text()
            if (shareddoc) {
              var encname = currentname

              var enccontnet = currentcontent
            } else {
              var encname = blowfish.encrypt(currentname, uid, {
                outputType: 1,
                cipherMode: 0
              })

              var enccontnet = blowfish.encrypt(currentcontent, uid, {
                outputType: 1,
                cipherMode: 0
              })
            }

            if (enccontnet == content) {
              $('#save-text').text('Saved')
            } else {
              $('#save-text').text('Unsaved')
            }
            if (encname == name) {

            } else {
              $('#save-text').text('Unsaved')
            }

            var currentcontent = $('#beta-editor').html()

            var currentname = $('#documentname').text()
            if (shareddoc) {
              var encname = currentname

              var enccontnet = currentcontent
            } else {
              var encname = blowfish.encrypt(currentname, uid, {
                outputType: 1,
                cipherMode: 0
              })

              var enccontnet = blowfish.encrypt(currentcontent, uid, {
                outputType: 1,
                cipherMode: 0
              })
            }

            if (enccontnet == content) {
              $('#save-text').text('Saved')
            } else {
              $('#save-text').text('Unsaved')
            }
            if (encname == name) {

            } else {
              $('#save-text').text('Unsaved')
            }
          }, 1000)
          setInterval(function () {
            var currentcontent = $('#beta-editor').html()

            if (shareddoc) {
              var enccontnet = currentcontent
            } else {
              var enccontnet = blowfish.encrypt(currentcontent, uid, {
                outputType: 1,
                cipherMode: 0
              })
            }

            if (enccontnet == content) {
              $('#save-text').text('Saved')
            } else {
              var currentname = $('#documentname').text()
              var preview = $('#beta-editor:first-child').text()
              preview = preview.substring(0, 40)

              if (shareddoc) {
                var encname = currentname
                enpreview = preview
              } else {
                var encname = blowfish.encrypt(currentname, uid, {
                  outputType: 1,
                  cipherMode: 0
                })
                encpreview = blowfish.encrypt(preview, uid, {
                  outputType: 1,
                  cipherMode: 0
                })
              }

              var updates = {}
              updates[docloadString + '/content'] = enccontnet

              firebase.database().ref().update(updates)
              updates[docloadString + '/name'] = encname

              firebase.database().ref().update(updates)
              updates[docloadString + '/preview'] = encpreview

              firebase.database().ref().update(updates)
              $('#save-text').text('Saved')
            }

            var currentname = $('#documentname').text()
            if (shareddoc) {
              var encname = currentname
            } else {
              var encname = blowfish.encrypt(currentname, uid, {
                outputType: 1,
                cipherMode: 0
              })
            }

            if (encname == name) {
              $('#save-text').text('Saved')
            } else {
              var updates = {}

              firebase.database().ref().update(updates)
              updates[docloadString + '/name'] = encname

              firebase.database().ref().update(updates)
              $('#save-text').text('Saved')
            }
          }, 2000)
        })
      } else {
        console.log('no doc loading')

        firebase.database().ref('docs/users/' + uid + '/userinfo').set({
          username: username,
          email: email,
          profile_picture: photoUrl
        })

        firebase.database().ref('docs/users/' + uid + '/settings/welcomedoc').once('value').then(function (snapshot) {
          var docisthere = snapshot.val()
          if (!docisthere) {
            preview = 'Welcome to Simple Docs!'
            preview = blowfish.encrypt(preview, uid, {
              outputType: 1,
              cipherMode: 0
            })
            var encwelcome = blowfish.encrypt('<p contenteditible="true" style="margin: 0px; font-size: 40px; line-height: normal; font-family: Monoton; -webkit-text-stroke-width: initial; -webkit-text-stroke-color: rgb(0, 0, 0); color: rgb(66, 66, 66);">Welcome to Simple Docs!</p>', uid, {
              outputType: 1,
              cipherMode: 0
            })
            var encwelcomename = blowfish.encrypt('Welcome', uid, {
              outputType: 1,
              cipherMode: 0
            })
            var welcomedocRef = firebase.database().ref('docs/users/' + uid + '/docs/').push()
            welcomedocRef.set({
              name: encwelcomename,
              preview: preview,
              content: encwelcome // ...
            })
            firebase.database().ref('docs/users/' + uid + '/settings/welcomedoc').set({
              made: true

            })
          }
        })

        var docsRef = firebase.database().ref('docs/users/' + uid + '/docs/')
        docsRef.on('child_added', function (data) {
          $('#loader').hide()
          var currentDocKey = data.key
          var currentDocName = data.val().name
          var content = data.val().content
          var shared = data.val().shared
          console.log(currentDocKey + ' ' + currentDocName)
          var dcryptdocname = blowfish.decrypt(currentDocName, uid, {
            outputType: 1,
            cipherMode: 0
          })
          var dycrptcontent = blowfish.decrypt(content, uid, {
            outputType: 1,
            cipherMode: 0
          })

          var preview = data.val().preview

          if (preview) {
            preview = blowfish.decrypt(preview, uid, {
              outputType: 1,
              cipherMode: 0
            })
          } else {
            preview = 'Sorry we could not find a preview'
          }

          if (shared) {
            preview = 'Preview not supported for shared docs :('
          }

          var documentredirecturl = 'edit?doc=' + currentDocKey
          $('#content').prepend('<div class="document-button" style="margin: 1%; width: 48%; float: left;"><a style="color: #777!important;" href="' + documentredirecturl + '"><div style=" position: relative;" class=" docbtn card-panel"><p class="doctxt grey-text text-darken-3" style="font-weight: 500; bottom: 50px; line-height: normal;"><i class="material-icons green-text text-lighten-1">insert_drive_file</i>&nbsp;' + dcryptdocname + '<span class="grey-text text-darken-3" style=" display: inline-block; white-space: nowrapoverflow: hidden;text-overflow: ellipsis; -o-text-overflow: ellipsis; width: 370px; font-weight: 300; color: #777!important;">&nbsp;' + preview + '...</span</p></div></a></div>')
          $('#content').hide()
          $('#content').fadeIn('slow')
        })
      }
      $('#canceldelete').click(function (e) {
        $('#loader').hide()
      })
      $('#deletedoc').click(function (e) {
        $('#loader').show()
        $('.modal').modal()
        $('#modal2').modal('open')
      })
      $('#newDoc').click(function (e) {
        $('#loader').show()
        $('.modal').modal()
        $('#modal1').modal('open')
      })
      $('#newdocsubmit').click(function (e) {
        var newname = $('#newdocname').val()
        console.log(newname)
        content = '<p contenteditible="true" style="margin: 0px; font-size: 20px; line-height: normal; font-family: Roboto;  -webkit-text-stroke-width: initial; -webkit-text-stroke-color: rgb(0, 0, 0);">Type here...</p>'
        var encnewname = blowfish.encrypt(newname, uid, {
          outputType: 1,
          cipherMode: 0
        })
        var encnewcontent = blowfish.encrypt(content, uid, {
          outputType: 1,
          cipherMode: 0
        })
        preview = blowfish.encrypt('New Document', uid, {
          outputType: 1,
          cipherMode: 0
        })
        var newDocRef = firebase.database().ref('docs/users/' + uid + '/docs/').push()

        newDocRef.set({
          name: encnewname,
          content: encnewcontent,
          preview: preview
        })
      })

      // User is signed in..........
    } else {
      $('.logout').hide()
      $('.login').show()
      var $toastContent = $('<span onclick="firebase.auth().signInWithRedirect(provider); $("#loader").show()">Please <span style="font-weight: 500;">login</span> to use Docs</span>')
      Materialize.toast($toastContent, 5000)
      $('#loader').hide()
      $('#editor-text').val('')

      // No user is signed in.
    }
  })
})
