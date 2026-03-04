import { GithubAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";

export async function loginGithub() {
  const provider = new GithubAuthProvider();
  return signInWithPopup(auth, provider);
}
