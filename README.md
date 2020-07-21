This is a web application using Go, React, and MYSQL to gamify productivity. The basic idea is that a user specifies certain policies/urls they would like to block
and when they start the timer on the web application, those policies/urls will be blocked. If the user can do at least 20 minutes of uninterrupted work, they can
play a mini-game on the web application. Every 20 minute session scales up the health points of the main character in the game. This web application works in 
conjuction with a chrome extension to block those policies/urls that the user specified on the web app.


There is a docker-compose file if one would like to run the application locally.

I utililized spritesheets from the Unity Asset Store from Kin Ng (https://assetstore.unity.com/publishers/9137) in my minigame and the landing page of my web 
application. I also used images (https://getflywheel.com/layout/wp-content/uploads/2018/05/productivity-apps-feature-lg-01-1-1-1280x356.png, 
https://static.vecteezy.com/system/resources/thumbnails/000/111/303/small/free-brown-brick-wall-vector.jpg, https://cdn0.iconfinder.com/data/icons/data-science-1-4/66/42-512.png, https://maxxia.co.uk/wp-content/uploads/2016/07/employee-productivity.jpg)
for an interactive landing page.

My dashboard was created from Material-UI template: https://material-ui.com/store/items/paperbase/

The web application is hosted on Azure at https://productivityio.azurewebsites.net
