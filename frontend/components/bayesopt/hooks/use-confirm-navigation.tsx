import { useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import { RootState } from "~/components/bayesopt/redux/store";
import { apiClient } from "~/services/api-client";

/**
 * Hook for managing navigation confirmation and session cleanup
 * Prompts user to confirm navigation when there are unsaved changes
 * Cleans up session on page unload
 */
export const useConfirmNavigation = () => {
  const router = useRouter();
  const isDirty = useSelector((state: RootState) => state.isDirty);
  const sessionId = useSelector(
    (state: RootState) => state.sessionConfig.sessionId
  );

  /**
   * Handle page change events
   * Prompt user to confirm if there are unsaved changes
   */
  const pageChangeHandler = useCallback(() => {
    if (isDirty) {
      if (!confirm("Discard changes?")) {
        throw "cancelled";
      }
    }
  }, [isDirty]);

  /**
   * Handle beforeunload event
   * Prompt user to confirm if there are unsaved changes
   */
  const beforeUnload = useCallback(
    (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "Discard changes?";
      }
    },
    [isDirty]
  );

  /**
   * Handle unload event
   * End the session when the page is unloaded
   */
  const unload = useCallback(async () => {
    if (sessionId !== "") {
      await apiClient.endSession({
        queries: {
          session_uuid: sessionId,
        },
      });
    }
  }, [sessionId]);

  /**
   * Set up event listeners
   */
  useEffect(() => {
    router.events.on("routeChangeStart", pageChangeHandler);
    window.addEventListener("beforeunload", beforeUnload);
    window.addEventListener("unload", unload);

    return () => {
      router.events.off("routeChangeStart", pageChangeHandler);
      window.removeEventListener("beforeunload", beforeUnload);
      window.removeEventListener("unload", unload);
    };
  }, [pageChangeHandler, beforeUnload, unload, router.events]);
};
