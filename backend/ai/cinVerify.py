import cv2
import pytesseract
import sys
import os

pytesseract.pytesseract.tesseract_cmd=r"C:\Program Files\Tesseract-OCR\tesseract.exe"
# Start TESSDATA_PREFIX fix
# Point to the directory CONTAINING the .traineddata files (tessdata itself)
os.environ["TESSDATA_PREFIX"] = r"C:\Program Files\Tesseract-OCR\tessdata"
#get image path from node
if len(sys.argv)<2:
    print("no image path provided")
    sys.exit(1)
image_path=sys.argv[1]

#check file exists
if not os.path.exists(image_path):
    print("invalid")
    sys.exit(1)

#read image
img=cv2.imread(image_path)
if img is None:
    print("invalid")
    sys.exit(1)

#convert to grayscale
gray=cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)

#apply thresholding for clearer text
_,thresh=cv2.threshold(gray,150,255,cv2.THRESH_BINARY)

#OCR to extract text
text=pytesseract.image_to_string(thresh, lang='ara+fra')

required_keywords=["بطاقة التعريف الوطنية","carte d'identité","الاسم","اللقب"]
if any(word in text for word in required_keywords):
    print("valid")
else:    
    print("invalid")
