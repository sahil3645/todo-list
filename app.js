const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// const date = require(__dirname + "/date.js"); // custom module

const app = express();
const PORT = 3000;

app.set("view engine", "ejs"); // to use EJS

app.use(bodyParser.urlencoded({ extended: true })); // to use body-parser
app.use(express.static("public")); // to load static files like style.css

// const items = ["Buy Food"];
// const workItems = [];
const defaultListName = "Sahil's List";

// Connection
mongoose
    .connect("mongodb://127.0.0.1:27017/todolistDB")
    .then(() => console.log("MongoDB Connected"))
    .catch(err => console.log("Mongo Error", err));

// items Schema
const itemsSchema = {
    name: String
};

// Mongoose Model
const Item = mongoose.model("Item", itemsSchema);

// Creating Some Items
const item1 = new Item({
    name: "Welcome to your TodoList!"
});

const item2 = new Item({
    name: "Hit + button to add a todo"
});

const item3 = new Item({
    name: "<-- Check to delete a todo"
});

const defaultItems = [item1, item2, item3];

// list Schema
const listSchema = {
    name: String,
    items: [itemsSchema]
};

// Mongoose Model for List
const List = mongoose.model("List", listSchema);


// Root Route
app.get("/", (req, res) => {

    Item.find({}).then(foundItems => {

        // if array is empty then we insert default items
        if (foundItems.length === 0) {
            // Inserting in satabase
            Item.insertMany(defaultItems)
                .then(() => console.log("Inserted Successfully"))
                .catch(err => console.log("Insertion Failed: ", err));

            res.redirect("/");
        }
        else { // else we render the foundItems list
            res.render("list", { listTitle: defaultListName, newListItems: foundItems });
        }

    }).catch(err => console.log("Error - Items not found: ", err));
});

// Different Routes for custom lists
app.get("/:customListName", (req, res) => {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName })
        .then((foundList) => {
            if (!foundList) {
                // Creating New List
                const list = new List({
                    name: customListName,
                    items: defaultItems
                }).save();

                res.redirect("/" + customListName);
            }
            else {
                // Show Existing List
                res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
            }
        })
        .catch(err => console.log("Error - Find List Failed: ", err));
});

app.post("/", (req, res) => {

    // console.log(req.body);
    const itemName = req.body.newItem; // saving user input
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === defaultListName) {
        item.save();
        res.redirect("/");
    }
    else {
        List.findOne({ name: listName })
            .then(foundList => {
                foundList.items.push(item);
                foundList.save();
                res.redirect("/" + listName);
            })
            .catch(err => console.log("List Not Found: ", err));
    }

});

// Delete Route
app.post("/delete", (req, res) => {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === defaultListName) {
        Item.findByIdAndRemove(checkedItemId)
            .then(() => console.log("Removed Successfully"))
            .catch(err => console.log("Remove Failed: ", err));

        res.redirect("/");
    }
    else {
        List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } })
            .then(foundList => {
                console.log("Removed Successfully");
                res.redirect("/" + listName);
            })
            .catch(err => console.log("Error - List not found: ", err));
    }

});

app.listen(PORT, () => console.log(`Server is running on Port: ${PORT}`));