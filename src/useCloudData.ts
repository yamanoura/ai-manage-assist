import { useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type FirestoreError,
} from "firebase/firestore";
import { initialData, normalizeAppData } from "./data";
import { db } from "./firebase";
import type { AppData } from "./types";

const STORAGE_KEY = "yoridokoro-data-v1";

export type SyncStatus = "loading" | "synced" | "saving" | "error";

function loadLocalData(): AppData {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return initialData;
  try {
    return normalizeAppData(JSON.parse(saved) as Partial<AppData>);
  } catch {
    return initialData;
  }
}

export function useCloudData(user: User) {
  const [data, setData] = useState<AppData>(loadLocalData);
  const [status, setStatus] = useState<SyncStatus>("loading");
  const [error, setError] = useState("");
  const readyRef = useRef(false);
  const lastSerializedRef = useRef("");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const firestore = db;
    if (!firestore) return;

    readyRef.current = false;
    setStatus("loading");
    setError("");
    const documentRef = doc(firestore, "users", user.uid, "app", "main");

    return onSnapshot(
      documentRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const remoteData = normalizeAppData(snapshot.data().data as Partial<AppData>);
          const serialized = JSON.stringify(remoteData);
          lastSerializedRef.current = serialized;
          setData(remoteData);
          readyRef.current = true;
          setStatus("synced");
          return;
        }

        const localData = loadLocalData();
        lastSerializedRef.current = JSON.stringify(localData);
        try {
          await setDoc(documentRef, {
            data: localData,
            updatedAt: serverTimestamp(),
            schemaVersion: 2,
          });
          readyRef.current = true;
          setStatus("synced");
        } catch (cause) {
          setStatus("error");
          setError(getFirestoreMessage(cause));
        }
      },
      (cause) => {
        setStatus("error");
        setError(getFirestoreMessage(cause));
      },
    );
  }, [user.uid]);

  useEffect(() => {
    const firestore = db;
    if (!firestore || !readyRef.current) return;
    const serialized = JSON.stringify(data);
    if (serialized === lastSerializedRef.current) return;

    const timer = window.setTimeout(async () => {
      setStatus("saving");
      const documentRef = doc(firestore, "users", user.uid, "app", "main");
      try {
        lastSerializedRef.current = serialized;
        await setDoc(
          documentRef,
          { data, updatedAt: serverTimestamp(), schemaVersion: 2 },
          { merge: true },
        );
        setStatus("synced");
      } catch (cause) {
        lastSerializedRef.current = "";
        setStatus("error");
        setError(getFirestoreMessage(cause));
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [data, user.uid]);

  return { data, setData, status, error };
}

function getFirestoreMessage(cause: unknown) {
  const error = cause as FirestoreError;
  if (error?.code === "permission-denied") {
    return "Firestoreへのアクセスが拒否されました。セキュリティルールを確認してください。";
  }
  if (error?.code === "unavailable") {
    return "現在オフラインです。接続が戻ると再同期されます。";
  }
  return "データを同期できませんでした。Firebaseの設定を確認してください。";
}
