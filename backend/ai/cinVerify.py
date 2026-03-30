import cv2
import pytesseract
from pytesseract import Output
import re
import sys
import numpy as np

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

def verify_strict():
    if len(sys.argv) < 2:
        print("invalid")
        return

    img_path = sys.argv[1]
    img = cv2.imread(img_path)
    if img is None:
        print("invalid")
        return

    h_img, w_img = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # --- STEP 1: FACE DETECTION ---
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    # try multiple scale factors to improve detection
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.05, minNeighbors=3, minSize=(30, 30))
    if len(faces) == 0:
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=2, minSize=(20, 20))

    face_detected = len(faces) > 0
    face_in_bottom_left = False

    if face_detected:
        (fx, fy, fw, fh) = faces[0]
        face_center_x = fx + fw / 2
        face_center_y = fy + fh / 2

        # bottom left = left half of image, bottom half of image
        face_in_bottom_left = (
            face_center_x < w_img * 0.5 and
            face_center_y > h_img * 0.4  # not too strict on vertical
        )

    # --- STEP 2: TUNISIAN FLAG DETECTION (top left = red region) ---
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # red color range in HSV
    lower_red1 = np.array([0, 100, 100])
    upper_red1 = np.array([10, 255, 255])
    lower_red2 = np.array([160, 100, 100])
    upper_red2 = np.array([180, 255, 255])

    mask1 = cv2.inRange(hsv, lower_red1, upper_red1)
    mask2 = cv2.inRange(hsv, lower_red2, upper_red2)
    red_mask = cv2.bitwise_or(mask1, mask2)

    # check top-left quarter for red (flag location)
    top_left_region = red_mask[:h_img//2, :w_img//2]
    red_pixel_count = cv2.countNonZero(top_left_region)
    has_flag = red_pixel_count > 300  # enough red pixels in top left

    # --- STEP 3: OCR ---
    # enhance image for better OCR
    enhanced = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    enhanced = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

    # try Arabic + French
    full_text_ara = pytesseract.image_to_string(enhanced, lang='ara+fra', config='--psm 6')
    full_text_ara = full_text_ara.lower()

    # also try English only as fallback for numbers
    full_text_eng = pytesseract.image_to_string(enhanced, lang='eng', config='--psm 6')

    # --- STEP 4: CIN NUMBER CHECK ---
    # combine both OCR results for number search
    combined_text = full_text_ara + " " + full_text_eng
    digits_only = re.sub(r'\D', '', combined_text)

    # look for any 8-digit sequence in the combined digits
    has_cin_number = bool(re.search(r'\d{8}', digits_only))

    # --- STEP 5: KEYWORD CHECK (relaxed - need only 1 match) ---
    keywords = ["الجمهورية", "تونس", "بطاقة", "تعريف", "التونسية", "وطنية"]
    matches = [k for k in keywords if k in full_text_ara]
    has_keywords = len(matches) >= 1  # relaxed to 1 keyword

    # --- FINAL VALIDATION ---
    # must have: face in bottom-left + flag in top-left + CIN number
    # keywords are a bonus but not strictly required due to OCR unreliability
    if face_detected and face_in_bottom_left and has_flag and has_cin_number:
        print("valid")
    elif face_detected and has_cin_number and has_keywords:
        # fallback: face + number + at least 1 keyword (no flag check)
        print("valid")
    else:
        # debug - remove in production
        print(f"DEBUG face:{face_detected} face_left:{face_in_bottom_left} flag:{has_flag} cin:{has_cin_number} keywords:{len(matches)}", file=sys.stderr)
        print("invalid")

if __name__ == "__main__":
    verify_strict()