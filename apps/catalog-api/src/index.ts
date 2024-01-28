import fs from "fs";
import https from "https";
import express from "express";
import { createApp } from "@gdcorp-commerce/builder";
import { ZodError } from "zod";
import { apiDefinition } from "./api-definition";
import {
  batchCreateProducts,
  batchUpdateProducts,
  createProduct,
  deleteProduct,
  getProduct,
  getProducts,
  updateProduct,
} from "./services/catalog/products";
import {
  createProductList,
  deleteProductList,
  getProductList,
  getProductLists,
  updateProductList,
} from "./services/catalog/product-lists";
import {
  batchCreateProductListItems,
  batchUpdateProductListItems,
  createProductListItem,
  deleteProductListItem,
  getProductListItem,
  getProductListItems,
  updateProductListItem,
} from "./services/catalog/product-list-items";

const app = createApp({
  apiDefinition,
  app: express(),
});

// const app = express();

// const credentials = {
//   key: process.env.SERVER_KEY,
//   cert: process.env.CLIENT_KEY,
// };

// if (process.env.NODE_ENV === "local") {
//   const key = fs.readFileSync(__dirname + "/../certs/selfsigned.key");
//   const cert = fs.readFileSync(__dirname + "/../certs/selfsigned.crt");
// }

// const server = https.createServer(credentials, app);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/v2/commerce/stores/:storeId/products", async (req, res) => {
  const storeId = req.params.storeId;
  const include = req.query.include;
  const result = await getProducts({ storeId, include });

  if (result.status === "error") {
    return res.status(500).json({ error: result.error } as any);
  }

  res.json({ products: result?.data || [] });
});

app.post("/v2/commerce/stores/:storeId/products", async (req, res) => {
  const storeId = req.params.storeId;
  const result = await createProduct({
    storeId,
    input: req.body,
  });

  if (result.status === "error") {
    return res.status(500).json({ error: result.error } as any);
  }

  res.status(201).json(result.data);
});

app.post("/v2/commerce/stores/:storeId/product-batches", async (req, res) => {
  const storeId = req.params.storeId;

  let result;

  if (req.body.action === "CREATE") {
    result = await batchCreateProducts({ storeId, input: req.body?.data });
  }

  if (req.body.action === "UPDATE") {
    result = await batchUpdateProducts({ storeId, input: req.body?.data });
  }

  if (result?.status === "error") {
    return res.status(500).json({ error: result.error } as any);
  }

  res.json(result?.data || []);
});

app.get("/v2/commerce/stores/:storeId/products/:id", async (req, res) => {
  const storeId = req.params.storeId;
  const id = req.params.id;
  const include = req.query.include;

  const result = await getProduct({ storeId, id, include });

  if (result.status === "error") {
    return res.status(500).json({ error: result.error } as any);
  }

  res.json(result?.data);
});

app.put("/v2/commerce/stores/:storeId/products/:id", async (req, res) => {
  const storeId = req.params.storeId;
  const id = req.params.id;

  const result = await updateProduct({
    id,
    storeId,
    input: req.body,
  });

  if (result.status === "error") {
    console.log(result.error);
    if (result.error instanceof ZodError) {
      return res.status(400).json({ error: result.error } as any);
    }

    return res.status(500).json({ error: result.error } as any);
  }

  return res.json(result.data);
});

app.delete("/v2/commerce/stores/:storeId/products/:id", async (req, res) => {
  const storeId = req.params.storeId;
  const id = req.params.id;

  const result = await deleteProduct({
    id,
    storeId,
  });

  if (result.status === "error") {
    return res.status(500).json({ error: result.error } as any);
  }

  return res.json(result.data);
});

app.get("/v2/commerce/stores/:storeId/product-lists", async (req, res) => {
  const storeId = req.params.storeId;
  const include = req.query.include;
  const ids = req.query.ids;

  const result = await getProductLists({ storeId, include, ids });

  if (result.status === "error") {
    return res.status(500).json({ error: result.error } as any);
  }

  return res.json({ productLists: result.data || [] });
});

app.post("/v2/commerce/stores/:storeId/product-lists", async (req, res) => {
  const storeId = req.params.storeId;

  const result = await createProductList({
    storeId,
    input: req.body,
  });

  if (result.status === "error") {
    return res.status(500).json({ error: result.error } as any);
  }

  return res.json(result.data);
});

app.get("/v2/commerce/stores/:storeId/product-lists/:id", async (req, res) => {
  const storeId = req.params.storeId;
  const id = req.params.id;
  const include = req.query.include;

  const result = await getProductList({ storeId, id, include });

  if (result.status === "error") {
    return res.status(500).json({ error: result.error } as any);
  }

  res.json(result.data);
});

app.put("/v2/commerce/stores/:storeId/product-lists/:id", async (req, res) => {
  const storeId = req.params.storeId;
  const id = req.params.id;

  const result = await updateProductList({ storeId, id, input: req.body });

  if (result.status === "error") {
    return res.status(500).json({ error: result.error } as any);
  }

  res.json(result.data);
});

app.delete(
  "/v2/commerce/stores/:storeId/product-lists/:id",
  async (req, res) => {
    const storeId = req.params.storeId;
    const id = req.params.id;

    const result = await deleteProductList({ storeId, id });

    if (result.status === "error") {
      return res.status(500).json({ error: result.error } as any);
    }

    res.json(result.data);
  },
);

app.get("/v2/commerce/stores/:storeId/product-list-items", async (req, res) => {
  const storeId = req.params.storeId;
  const productListId = req.query.productListId;

  const result = await getProductListItems({ storeId, productListId });

  if (result.status === "error") {
    return res.status(500).json({ error: result.error } as any);
  }

  res.json({ productListItems: result.data || [] });
});

app.post(
  "/v2/commerce/stores/:storeId/product-list-items",
  async (req, res) => {
    const storeId = req.params.storeId;

    const result = await createProductListItem({
      storeId,
      input: req.body,
    });

    if (result.status === "error") {
      return res.status(500).json({ error: result.error } as any);
    }

    res.json(result.data);
  },
);

app.post(
  "/v2/commerce/stores/:storeId/product-list-item-batches",
  async (req, res) => {
    const storeId = req.params.storeId;

    let result;

    if (req.body.action === "CREATE") {
      result = await batchCreateProductListItems({
        storeId,
        input: req.body.data,
      });
    }

    if (req.body.action === "UPDATE") {
      result = await batchUpdateProductListItems({
        storeId,
        input: req.body.data as any,
      });
    }

    if (result?.status === "error") {
      return res.status(500).json({ error: result.error } as any);
    }

    res.json(result?.data || []);
  },
);

app.get(
  "/v2/commerce/stores/:storeId/product-list-items/:id",
  async (req, res) => {
    const storeId = req.params.storeId;
    const id = req.params.id;

    const result = await getProductListItem({ storeId, id });

    if (result.status === "error") {
      return res.status(500).json({ error: result.error } as any);
    }

    res.json(result.data);
  },
);

app.put(
  "/v2/commerce/stores/:storeId/product-list-items/:id",
  async (req, res) => {
    const storeId = req.params.storeId;
    const id = req.params.id;

    const result = await updateProductListItem({
      storeId,
      id,
      input: req.body,
    });

    if (result.status === "error") {
      return res.status(500).json({ error: result.error } as any);
    }

    res.json(result.data);
  },
);

app.delete(
  "/v2/commerce/stores/:storeId/product-list-items/:id",
  async (req, res) => {
    const storeId = req.params.storeId;
    const id = req.params.id;

    const result = await deleteProductListItem({ storeId, id });

    if (result.status === "error") {
      return res.status(500).json({ error: result.error } as any);
    }

    res.json(result.data);
  },
);

app.listen(4000, () => console.log("Listening on http://localhost:4000"));
