# blog-platform
I have created the 
walkthrough
 documenting the project's structure, files, and database models. The 
task checklist
 has also been updated to show all steps are completed.

Summary of Completed Files
Backend Files:
package.json & .env configurations.
config/db.js database connection module using Mongoose.
models/User.js, models/Post.js, and models/Comment.js database schemas.
middleware/auth.js JWT authorization handler.
routes/auth.js, routes/posts.js, and routes/comments.js Express REST controllers.
server.js application entrance configuration.
Frontend Static Files (public/):
css/style.css glassmorphic dark theme styling sheet.
js/api.js central API utility methods and state checkers.
js/app.js, js/auth.js, js/create-post.js, and js/post-detail.js page controllers.
index.html, login.html, register.html, post.html, and create-post.html markup files.
To run the application locally in the future, navigate to the d:\blog directory and run npm install followed by npm run dev. Ensure a MongoDB instance is running on your machine or configure the connection string inside .env.
