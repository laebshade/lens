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
import { KubernetesCluster, WebLink } from "../../common/catalog-entities";
import { CatalogEntityDetailRegistry, CatalogEntityDetailsProps } from "../../extensions/registries";
import { DrawerItem, DrawerTitle } from "../components/drawer";

export function initCatalogEntityDetailRegistry() {
  CatalogEntityDetailRegistry.getInstance()
    .add([
      {
        apiVersions: [KubernetesCluster.apiVersion],
        kind: KubernetesCluster.kind,
        components: {
          Details: ({ entity }: CatalogEntityDetailsProps<KubernetesCluster>) => (
            <>
              <DrawerTitle title="Kubernetes Information" />
              <div className="box grow EntityMetadata">
                <DrawerItem name="Distribution">
                  {entity.metadata.distro || "unknown"}
                </DrawerItem>
                <DrawerItem name="Kubelet Version">
                  {entity.metadata.kubeVersion || "unknown"}
                </DrawerItem>
              </div>
            </>
          ),
        },
      },
      {
        apiVersions: [WebLink.apiVersion],
        kind: WebLink.kind,
        components: {
          Details: ({ entity }: CatalogEntityDetailsProps<WebLink>) => (
            <>
              <DrawerTitle title="More Information" />
              <DrawerItem name="URL">
                {entity.spec.url}
              </DrawerItem>
            </>
          ),
        },
      },
    ]);
}
