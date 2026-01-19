import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/layout";
import { ProtectedRoute } from "./components/protected-route";
import { TradePage } from "./pages/trade";
import { FaucetPage } from "./pages/faucet";
import { AchievementsPage } from "./pages/achievements";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <TradePage />,
      },
      {
        path: "faucet",
        element: (
          <ProtectedRoute>
            <FaucetPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "achievements",
        element: <AchievementsPage />,
      },
    ],
  },
]);
