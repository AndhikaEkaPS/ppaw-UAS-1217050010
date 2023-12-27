const express = require("express");
const router = express.Router();
const User = require("../models/users");
const multer = require("multer");
const fs = require("fs").promises;

// image upload
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./uploads");
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname+ "_" + Date.now() + "_" + file.originalname);
    }
});

var upload = multer({
    storage: storage,
}).single("image");

// insert an  user into a database
router.post("/add", upload, async (req, res) => {
    const user = new User({
        name: req.body.name,
        bod: req.body.bod,
        email: req.body.email,
        phone: req.body.phone,
        job: req.body.job,
        motto: req.body.motto,
        image: req.file.filename,
    });
    // user.save(async(err) => {
        // if(err){
        //     res.json({message: err.message, type: "danger"});
        // } else {
        //     req.session.message = {
        //         type: "success",
        //         message: "User added successfully!"
        //     };
        //     res.redirect("/");
        // }
        try {
            await user.save();
            req.session.message = {
                type: "success",
                message: "User added Successfully!"
            };
            res.redirect("/");
        } catch(err) {
            console.error("Save Error", err);
            res.json({ message: err.message, type: "danger"});
        }
    // });
});

// Get all users route
router.get("/", async(req, res) => {
    // User.find().exec((err, users) => {
    //     if (err) {
    //         res.json({ message: err.message });
    //     } else {
    //         res.render("index", {
    //             title: "Home Page",
    //             users: users,
    //         });
    //     }
    // });
    try {
        // Use the correct model name
        const users = await User.find().exec();

        res.render('index', {
            title: "Home Page",
            users: users
        });
    } catch(err) {
        res.json({ message: err.message });
    }
});

router.get("/add", (req, res) => {
    res.render("add_users", { title: "Add Users" });
});

// Edit an user route
router.get("/edit/:id", async (req, res) => {
    // let id = req.params.id;
    // User.findById(id, (err, user) => {
    //     if (err) {
    //         res.redirect("/");
    //     } else {
    //         if (user == null) {
    //             res. redirect("/");
    //         } else {
    //             res.render("edit_users", {
    //                 title: "Edit User",
    //                 user: user,
    //             });
    //         }
    //     }
    // });
    try {
        const id = req.params.id;
        const user = await User.findById(id);

        if (!user) {
            return res.redirect("/");
        }

        res.render("edit_users", {
            title: "Edit User",
            user: user,
        });
    } catch (err) {
        console.error("Error fetching user:", err);
        res.redirect("/");
    }
});

// Update user route
router.post("/update/:id", upload, async (req, res) => {
    // let id = req.params.id;
    // let new_image = "";

    // if (req.file) {
    //     new_image = req.file.filename;
    //     try {
    //         fs.unlinkSync("./uploads/"+req.body.old_image);
    //     } catch (err) {
    //         console.log(err);
    //     }
    // } else {
    //     new_image = req.body.old_image;
    // }

    // User.findByIdAndUpdate(id, {
    //     name: req.body.name,
    //     email: req.body.email,
    //     phone: req.body.phone,
    //     image: new_image,
    // }, (err, result) => {
    //     if(err){
    //         res.json({ message: err.message, type: "danger"});
    //     } else {
    //         req.session.message = {
    //             type: "success",
    //             message: "User updated successfully!",
    //         };
    //         res.redirect("/");
    //     }
    // });
    try {
        const id = req.params.id;
        let newImage = "";

        if (req.file) {
            newImage = req.file.filename;
            await fs.unlink(`./uploads/${req.body.old_image}`);
        } else {
            newImage = req.body.old_image;
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            {
                name: req.body.name,
                bod: req.body.bod,
                email: req.body.email,
                phone: req.body.phone,
                job: req.body.job,
                motto: req.body.motto,
                image: newImage,
            },
            { new: true } // To get the updated document
        );

        if (!updatedUser) {
            return res.json({ message: "User not found", type: "danger" });
        }

        req.session.message = {
            type: "success",
            message: "User updated successfully!",
        };
        res.redirect("/");
    } catch (err) {
        console.error("Error updating user:", err);
        res.json({ message: err.message, type: "danger" });
    }
});

//Delete user route
router.get("/delete/:id", async (req, res) => {
    // let id = req.params.id;
    // User.findByIdAndRemove(id, (err, result) => {
    //     if(result.image != '') {
    //         try {
    //             fs.unlinkSync("./uploads/"+result.image);
    //         } catch(err) {
    //             console.log(err);
    //         }
    //     }

    //     if(err) {
    //         res.json({ message: err.message });
    //     } else {
    //         req.session.message = {
    //             type: "info",
    //             message: "User deleted successfully!"
    //         };
    //         res.redirect("/");
    //     }
    // });
    let id = req.params.id;
    try {
        const user = await User.findOneAndDelete({ _id: id });

        if (user && user.image !== '') {
            try {
                fs.unlinkSync("./uploads/" + user.image);
            } catch (err) {
                console.log(err);
            }
        }

        req.session.message = {
            type: "info",
            message: "User deleted successfully!",
        };
        res.redirect("/");
    } catch (err) {
        res.json({ message: err.message, type: "danger" });
    }
});

module.exports = router;