import React, { useState } from "react";
import { Button, Form } from "semantic-ui-react";
import gql from "graphql-tag";
import { useMutation } from "@apollo/react-hooks";

import firebase from "../firebase";
import { useForm } from "../util/hooks";
import { FETCH_POSTS_QUERY } from "../util/graphql";

function PostForm() {
  const [files, setFiles] = useState(null);
  const { values, onChange, onSubmit } = useForm(createPostCallback, {
    body: "",
    image: "",
  });

  const [createPost, { error }] = useMutation(CREATE_POST_MUTATION, {
    variables: values,
    update(proxy, result) {
      const data = proxy.readQuery({
        query: FETCH_POSTS_QUERY,
      });
      data.getPosts = [result.data.createPost, ...data.getPosts];
      proxy.writeQuery({ query: FETCH_POSTS_QUERY, data });
      values.body = "";
      values.image = "";
    },
  });

  function handleChange(files) {
    setFiles(files);
  }

  function createPostCallback() {
    //try {
    let bucketName = "images";
    let file = files[0];
    let storageRef = firebase.storage().ref(`${bucketName}/${file.name}`);
    let uploadTask = storageRef.put(file);
    uploadTask.on(
      "state_changed",
      (snapshot) => {},
      (error) => {
        console.log(error);
      },
      () => {
        storageRef.getDownloadURL().then((url) => {
          values.image = url;
          createPost();
          window.location.reload();
        });
      }
    );
  }
  

  return (
    <Form onSubmit={onSubmit}>
      <h2>Create a post</h2>
      <Form.Field>
        <Form.Input
          placeholder="Insert Meme here~"
          name="body"
          onChange={onChange}
          value={values.body}
          error={error ? true : false}
        />
        <Form.Input
          type="file"
          onChange={(e) => {
            handleChange(e.target.files);
          }}
        />
        <Button type="submit" color="teal">
          Submit
        </Button>
      </Form.Field>
    </Form>
  );
}

const CREATE_POST_MUTATION = gql`
  mutation createPost($body: String!, $image: String!) {
    createPost(body: $body, image: $image) {
      id
      body
      image
      createdAt
      username
      likes {
        id
        username
        createdAt
      }
      likeCount
      comments {
        id
        body
        username
        createdAt
      }
      commentCount
    }
  }
`;

export default PostForm;
