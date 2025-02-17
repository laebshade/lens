/**
 * Copyright (c) 2021 OpenLens Authors
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import React from "react";
import "@testing-library/jest-dom/extend-expect";
import { render, fireEvent } from "@testing-library/react";
import { SidebarCluster } from "../sidebar-cluster";
import { KubernetesCluster } from "../../../../common/catalog-entities";

jest.mock("../../../../common/hotbar-store", () => ({
  HotbarStore: {
    getInstance: () => ({
      isAddedToActive: jest.fn(),
    }),
  },
}));

const clusterEntity = new KubernetesCluster({
  metadata: {
    uid: "test-uid",
    name: "test-cluster",
    source: "local",
    labels: {},
  },
  spec: {
    kubeconfigPath: "",
    kubeconfigContext: "",
  },
  status: {
    phase: "connected",
  },
});

describe("<SidebarCluster/>", () => {
  it("renders w/o errors", () => {
    const { container } = render(<SidebarCluster clusterEntity={clusterEntity}/>);

    expect(container).toBeInstanceOf(HTMLElement);
  });

  it("renders cluster avatar and name", () => {
    const { getByText } = render(<SidebarCluster clusterEntity={clusterEntity}/>);

    expect(getByText("tc")).toBeInTheDocument();
    expect(getByText("test-cluster")).toBeInTheDocument();
  });

  it("renders cluster menu", async () => {
    const { getByTestId, getByText } = render(<SidebarCluster clusterEntity={clusterEntity}/>);
    const link = getByTestId("sidebar-cluster-dropdown");

    fireEvent.click(link);
    expect(await getByText("Add to Hotbar")).toBeInTheDocument();
  });
});

