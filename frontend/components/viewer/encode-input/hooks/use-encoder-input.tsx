import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { apiClient } from "~/services/api-client";
import { setEncoded } from "../../redux/interaction-data";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";

export const useFastaEncoder = (sessionId: string) => {
  const dispatch = useDispatch();
  const encodedData = useSelector(
    (state: RootState) => state.interactionData.encoded
  );
  const [isValid, setIsValid] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!sessionId) {
        return;
      }

      const file = e.target.files?.[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();

      reader.onload = async (e) => {
        if (!e.target?.result) {
          return;
        }

        setIsLoading(true);
        try {
          const text = e.target?.result as string;
          const regex = /^>\s*([^\n\r]+)[\n\r]+([ACGTUacgtu\n\r]+)$/gm;
          let ids: string[] = [];
          let seqs: string[] = [];
          let match: RegExpExecArray | null;

          while ((match = regex.exec(text))) {
            ids.push(match[1]);
            seqs.push(
              match[2]
                .replace(/[\n\r]/g, "")
                .toUpperCase()
                .replace(/T/g, "U")
            );
          }

          if (ids.length === 0 || seqs.length === 0) {
            setIsValid(false);
            return;
          }

          const encoded = await apiClient.encode({
            session_uuid: sessionId,
            sequences: seqs,
          });

          dispatch(
            setEncoded({
              ids: encodedData.ids.concat(ids),
              randomRegions: encodedData.randomRegions.concat(seqs),
              coordsX: encodedData.coordsX.concat(encoded.coords_x),
              coordsY: encodedData.coordsY.concat(encoded.coords_y),
              shown: encodedData.shown.concat(Array(ids.length).fill(true)),
            })
          );
          setIsValid(true);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsText(file);
    },
    [sessionId]
  );

  return {
    isValid,
    isLoading,
    onFileChange,
  };
};

export const useFormEncoder = (sessionId: string) => {
  const dispatch = useDispatch();
  const encodedData = useSelector(
    (state: RootState) => state.interactionData.encoded
  );
  const [value, setValue] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value.toUpperCase().replace(/T/g, "U"));
    setIsValid(/^[ACGTUacgtu]+$/.test(e.target.value));
  }, []);

  const onAdd = useCallback(async () => {
    if (!sessionId) {
      return;
    }

    if (!isValid) {
      return;
    }

    setIsLoading(true);
    try {
      const encoded = await apiClient.encode({
        session_uuid: sessionId,
        sequences: [value],
      });
      dispatch(
        setEncoded({
          ids: encodedData.ids.concat(`manual-${encodedData.ids.length}`),
          randomRegions: encodedData.randomRegions.concat(value),
          coordsX: encodedData.coordsX.concat(encoded.coords_x),
          coordsY: encodedData.coordsY.concat(encoded.coords_y),
          shown: encodedData.shown.concat(Array(1).fill(true)),
        })
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, isValid, value]);
  return {
    value,
    isValid,
    isLoading,
    onChange,
    onAdd,
  };
};
