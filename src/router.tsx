import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/layout";
import { ProtectedRoute } from "./components/protected-route";
import { HomePage } from "./pages/home";
import { FaucetPage } from "./pages/faucet";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "faucet",
        element: (
          <ProtectedRoute>
            <FaucetPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
