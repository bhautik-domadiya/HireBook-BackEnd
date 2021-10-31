const fileUploadModel = require("../models/FileUploadModel");
const apiResponse = require("../helpers/apiResponse");
const { GridFsStorage } = require("multer-gridfs-storage");
const mongoose = require('mongoose');
const multer = require("multer");
const { CONFIG } = require("../helpers/config");
const auth = require("../middlewares/jwt");
const { body } = require("express-validator");
const db = mongoose.connection;
const collection = db.collection('files.files');
const collectionChunks = db.collection('files.chunks');


// DB connection
const MONGODB_URL = CONFIG.MONGODB_URL;

const storage = new GridFsStorage({
  url: MONGODB_URL,
  file: (req, file) => {
    return {
      bucketName: "files",
      //Setting collection name, default name is fs
      filename: file.originalname,
      //Setting file name to original name of file
    };
  },
});

storage.on("connection", (db) => {
  //Setting up upload for a single file
  upload = multer({
    storage: storage,
  }).array("files", 5);
});

exports.uploadFiles = [
  auth,
  (req, res) => {
    upload(req, res, (err) => {
      if (err) {
        return apiResponse.ErrorResponse(res, err);
      }

      console.log(" files ", req.files);
      const fileIds = req?.files?.map((file) => file.id);

      return apiResponse.successResponseWithData(
        res,
        "Files Uploaded Successfully",
        fileIds
      );
    });
  }];

//   ---- GET ALL FILES ------
exports.getFiles = [
  body("fileIds", "fileIds must not be empty").isArray({ min: 1 }),
  (req, res) => {
    collection.find({ _id: mongoose.Types.ObjectId(req.params.id) }).toArray(function (err, docs) {
      if (err) {
        return apiResponse.ErrorResponse(res, "Something went wrong while fetching file.");
      }
      if (!docs || docs.length === 0) {
        return apiResponse.ErrorResponse(res, "No file found");
      } else {
        //Retrieving the chunks from the db
        collectionChunks.find({ files_id: docs[0]._id }).sort({ n: 1 }).toArray(function (err, chunks) {
          if (err) {
            return apiResponse.ErrorResponse(res, "Something went wrong while fetching chunks.");
          }
          if (!chunks || chunks.length === 0) {
            //No data found
            return apiResponse.ErrorResponse(res, "No file chunks found.");
          }
          //Append Chunks
          let fileData = [];
          for (let i = 0; i < chunks.length; i++) {
            //This is in Binary JSON or BSON format, which is stored
            //in fileData array in base64 endocoded string format
            fileData.push(chunks[i].data.toString('base64'));
          }
          //Display the chunks using the data URI format
          let finalFile = 'data:' + docs[0].contentType + ';base64,' + fileData.join('');
          res.set('Content-Type', docs[0].contentType);
          res.set('Content-Disposition', `attachment; filename=${docs[0].filename}`);
          res.set('Content-Length', `${docs[0].length}`);
          res.send(finalFile);
        });
      }
    });
  }];
