// const { findByIdAndDelete } = require('../models/connection');
// const { connections, body } = require("mongoose");
// const connection = require("../models/connection");
const model = require("../models/connection");
const model_rsvp = require("../models/rsvp");

//GET /connections: send all the connection
exports.index = (req, res, next) => {
  model
    .find()
    .then((connections) => {
      //
      let conn = {};
      connections.forEach((connection) => {
        if (conn[connection.category]) {
          conn[connection.category].push(connection);
        } else {
          conn[connection.category] = [connection];
        }
      });
      res.render("./connection/index", { conn });
    })
    .catch((err) => next(err));
};

//GET /connections/new send new connection form
exports.new = (req, res) => {
  console.log("sending new connections page");
  res.render("./connection/new");
};

//POST /connections create new connection
exports.createConnection = (req, res, next) => {
  let connection = new model(req.body);
  console.log("testing session in create connection\n=>", req.session.userInfo);
  connection.hostName = req.session.userInfo["id"];
  connection
    .save()
    .then((connection) => {
      req.flash("success", "connection Created!");
      res.redirect("/connections");
    })
    .catch((err) => {
      if (err.name === "ValidationError") {
        err.status = 400;
        req.flash("error", err.message);
        res.redirect("back");
      } else {
        next(err);
      }
      // next(err);
    });
};

//GET /connections/:id send specific connection
exports.findById = (req, res, next) => {
  let id = req.params.id;

  Promise.all([
    model.findById(id).populate("hostName", "firstName lastName"),
    model_rsvp.find({ connection: id, commitment: "yes" }).countDocuments(),
  ])
    .then((result) => {
      const [connection, rsvps] = result;
      if (connection) {
        let conn = connection.toObject();
        conn.rsvps = rsvps;
        console.log("conn =>", conn);
        res.render("./connection/show", { conn });
      } else {
        let err = new Error("cannot find connection with id " + id);
        err.status = 404;
        next(err);
      }
    })
    .catch((err) => next(err));
};

//GET /connections/:id/edit send edit page for specific connection
exports.editById = (req, res, next) => {
  let id = req.params.id;

  model
    .findById(id)
    .then((connection) => {
      if (connection) {
        res.render("./connection/edit", { conn: connection });
      } else {
        let err = new Error("cannot find connection with id " + id);
        err.status = 404;
        next(err);
      }
    })
    .catch((err) => next(err));
};

//POST /connections/:id edit the specific connection
exports.updateById = (req, res, next) => {
  let id = req.params.id;

  model
    .findByIdAndUpdate(id, req.body, {
      useFindAndModify: false,
      runValidators: true,
    })
    .then((connection) => {
      if (connection) {
        let url = "/connections/" + id;
        req.flash("success", "connection updated!");
        res.redirect(url);
      } else {
        let err = new Error("cannot find connection with id " + id);
        err.status = 404;
        next(err);
      }
    })
    .catch((err) => {
      if (err.name === "ValidationError") {
        err.status = 400;
      }
      next(err);
    });
};

//DELETE /connections/:id delete the specific connection
exports.deleteById = (req, res, next) => {
  let id = req.params.id;

  Promise.all([
    model.findByIdAndDelete(id),
    model_rsvp.deleteMany({ connection: id }),
  ])
    .then((result) => {
      const [connection, dels] = result;
      if (connection) {
        req.flash("success", "connection Deleted!");
        res.redirect("/connections");
      } else {
        let err = new Error("cannot find connection with id " + id);
        err.status = 404;
        next(err);
      }
    })
    .catch((err) => console.log(err));
};

exports.doRSVP = (req, res, next) => {
  let id = req.params.id;
  let commitment = req.query.commitment;
  if (commitment) {
    commitment = commitment.toLowerCase();
  }
  let userId = req.session.userInfo["id"];
  let g_rsvp = {};
  g_rsvp["user"] = userId;
  g_rsvp["connection"] = id;
  g_rsvp["commitment"] = commitment;
  console.log("rsvp=>", g_rsvp);
  // check if user has already RSVPed to connection or not
  model_rsvp
    .findOne({ connection: id, user: userId })
    .then((rsvp) => {
      if (rsvp) {
        console.log("rsvp exists");
        if (rsvp.commitment === commitment) {
          console.log("commitment is same no change");
          // replace current rsvp
          req.flash("success", "Same RSVP responses is already present!");
          res.redirect("/users/profile");
        } else {
          console.log("update rsvp as commitment is changed");
          //"replace the rsvp row"
          // let row = new model_rsvp(g_rsvp);
          model_rsvp
            .updateOne(
              { connection: id },
              { $set: { commitment: commitment } },
              { runValidators: true }
            )
            .then((rsvp) => {
              req.flash("success", "RSVP change succesful!");
              res.redirect("/users/profile");
            })
            .catch((err) => {
              if (err.name === "ValidationError") {
                err.status = 400;
                req.flash("error", err.message);
                // next(err);
                res.redirect("back");
              } else {
                next(err);
              }
            });
        }
      } else {
        console.log("rsvp does not exist, create new one");
        // save whole new row(rsvp to connection)
        let row = new model_rsvp(g_rsvp);
        console.log("going to creat new RSVP");
        row
          .save()
          .then((rsvp) => {
            console.log("new RSVP created");
            req.flash("success", "RSVP succesful!");
            res.redirect("/users/profile");
          })
          .catch((err) => {
            console.log("err creating new RSVP");
            if (err.name === "ValidationError") {
              err.status = 400;
              req.flash("error", err.message);
              // next(err);
              res.redirect("back");
            } else {
              next(err);
            }
          });
      }
    })
    .catch((err) => {
      next(err);
    });
};

exports.deleteRSVP = (req, res, next) => {
  let id = req.params.id;
  let userId = req.session.userInfo["id"];
  model_rsvp
    .deleteOne({ connection: id, user: userId })
    .then((result) => {
      res.redirect("back");
    })
    .catch((err) => next(err));
};
