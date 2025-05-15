import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import axios from "axios";
import config from "../config";
import BackOffice from "../components/BackOffice";

function ProductDetail() {
  const { id } = useParams(); // Get product ID from URL
  const [product, setProduct] = useState(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await axios.get(`${config.apiPath}/product/detail/${id}`);
      setProduct(res.data);
    } catch (e) {
      Swal.fire({
        title: "Error",
        text: "ไม่พบข้อมูลสินค้า",
        icon: "error",
      });
    }
  };

  const addToCart = (item) => {
    const savedCart = JSON.parse(localStorage.getItem("carts")) || [];
    const isAlreadyInCart = savedCart.some(
      (cartItem) => cartItem.id === item.id
    );

    if (isAlreadyInCart) {
      Swal.fire({
        title: "เตือน!",
        text: "สินค้านี้อยู่ในตะกร้าแล้ว!",
        icon: "warning",
        timer: 500,
        showConfirmButton: false,
      });
      return;
    }

    const updatedCart = [...savedCart, item];
    localStorage.setItem("carts", JSON.stringify(updatedCart));

    Swal.fire({
      title: "สำเร็จ!",
      text: "หยิบสินค้าเรียบร้อยแล้ว!",
      icon: "success",
      timer: 500,
      showConfirmButton: false,
    });
  };

  const addToHeart = (item) => {
    const savedHeart = JSON.parse(localStorage.getItem("heart")) || [];
    const isAlreadyInHeart = savedHeart.some(
      (heartItem) => heartItem.id === item.id
    );

    if (isAlreadyInHeart) {
      Swal.fire({
        title: "เตือน!",
        text: "สินค้านี้ถูกใจแล้ว!",
        icon: "warning",
        timer: 500,
        showConfirmButton: false,
      });
      return;
    }

    const updatedHeart = [...savedHeart, item];
    localStorage.setItem("heart", JSON.stringify(updatedHeart));

    Swal.fire({
      title: "สำเร็จ!",
      text: "ถูกใจสินค้าเรียบร้อยแล้ว!",
      icon: "success",
      timer: 500,
      showConfirmButton: false,
    });
  };

  if (!product) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <BackOffice>
      <div className="container mt-4">
        <div
          className="cart-container d-flex p-4 rounded shadow-sm bg-white"
          style={{ gap: "20px" }}
        >
          {/* Product List: Left Side */}
          <div className="cart-left">
            <div className="cart-header text-center">
              <div>
                {/* Main Image Display */}
                {product.images && product.images.length > 0 ? (
                  <div>
                    <img
                      id="main-image"
                      src={`${config.apiPath}/uploads/${product.images[0].url}`}
                      className="img-fluid rounded border"
                      alt={`${product.name} - main`}
                      style={{
                        width: "100%",
                        height: "450px",
                        objectFit: "contain",
                        backgroundColor: "#ffff",
                      }}
                    />
                    {/* Thumbnails */}
                    <div
                      className="d-flex mt-3"
                      style={{
                        gap: "10px",
                        overflowX: "auto",
                      }}
                    >
                      {product.images.map((image, index) => (
                        <img
                          key={index}
                          src={`${config.apiPath}/uploads/${image.url}`}
                          className="img-thumbnail rounded"
                          alt={`${product.name} - thumbnail ${index + 1}`}
                          style={{
                            width: "75px",
                            height: "75px",
                            cursor: "pointer",
                            objectFit: "cover",
                            border: "1px solid #ddd",
                          }}
                          onClick={() => {
                            const mainImage =
                              document.getElementById("main-image");
                            if (mainImage) {
                              mainImage.src = `${config.apiPath}/uploads/${image.url}`;
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <img
                    src="/default_image.jpg"
                    className="img-fluid rounded border"
                    alt="Default"
                    style={{
                      width: "100%",
                      height: "450px",
                      objectFit: "contain", // แสดงภาพทั้งหมด
                      backgroundColor: "#f8f8f8", // พื้นหลังกรณีภาพไม่เต็ม
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Payment Information: Right Side */}
          <div className="cart-right mt-3">
            <div>
              <h5>{product.name}</h5>
            </div>
            <div>
              <p className="text-muted">{product.detail}</p>
            </div>
            <div>
              <h5>฿{product.price}</h5>
            </div>
            <div className="cart-footer d-flex mt-3 align-items-center">
              {product.status === "reserved" ? (
                <div
                  className="badge text-white px-3 py-3 shadow-sm d-flex align-items-center justify-content-center gap-2 bg-secondary"
                  style={{ gap: "10px", width: "auto" }}
                >
                  <i className="fa fa-clock fs-4"></i>
                  <span className="fs-5">สินค้าติดเช่า</span>
                </div>
              ) : product.status === "delete" ? (
                <div
                  className="badge text-white px-3 py-3 shadow-sm d-flex align-items-center justify-content-center gap-2 bg-danger"
                  style={{ gap: "10px", width: "auto" }}
                >
                  <i className="fa fa-ban fs-4"></i>
                  <span className="fs-5">ไม่มีสินค้า</span>
                </div>
              ) : (
                <div className="d-flex" style={{ gap: "15px", width: "100%" }}>
                  <button
                    className="btn btn-primary btn-lg w-100"
                    onClick={() => addToCart(product)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                    }}
                  >
                    <i className="fa fa-shopping-cart"></i>
                    <span>หยิบสินค้า</span>
                  </button>
                  <button
                    className="btn btn-danger btn-lg w-100"
                    onClick={() => addToHeart(product)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "10px",
                    }}
                  >
                    <i className="fa fa-heart"></i>
                    <span>ถูกใจ</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </BackOffice>
  );
}

export default ProductDetail;
