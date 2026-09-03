import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

interface BarcodeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanned: (barcode: string) => void;
}

export function BarcodeScannerModal({
  visible,
  onClose,
  onScanned,
}: BarcodeScannerModalProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScanned(data);
    setTimeout(() => {
      setScanned(false);
      onClose();
    }, 400);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {!permission ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#0057FF" />
          </View>
        ) : !permission.granted ? (
          <View style={styles.centerBox}>
            <Text style={styles.permTitle}>Camera Permission Required</Text>
            <Text style={styles.permDesc}>
              Stocky needs camera access to scan item barcode identifiers directly from store shelves.
            </Text>
            <TouchableOpacity onPress={requestPermission} style={styles.permBtn}>
              <Text style={styles.permBtnText}>Grant Camera Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={[styles.permBtn, styles.cancelBtn]}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: [
                'ean13',
                'ean8',
                'upc_a',
                'upc_e',
                'code128',
                'code39',
                'qr',
              ],
            }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          >
            {/* Top Bar */}
            <View style={styles.topBar}>
              <Text style={styles.headerText}>Scan Barcode</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeRoundBtn}>
                <Text style={styles.closeRoundText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Target Reticle */}
            <View style={styles.reticleContainer}>
              <View style={styles.reticle}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                {scanned && <View style={styles.scanLine} />}
              </View>
              <Text style={styles.instructText}>
                Align product barcode within frame
              </Text>
            </View>
          </CameraView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centerBox: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  permDesc: {
    fontSize: 13,
    color: '#555555',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  permBtn: {
    backgroundColor: '#0057FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  permBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBEBEB',
  },
  cancelBtnText: {
    color: '#333333',
    fontSize: 13,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 54,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  closeRoundBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeRoundText: {
    color: '#FFFFFF',
    fontSize: 15,
  },
  reticleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reticle: {
    width: 260,
    height: 180,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#0057FF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanLine: {
    width: '90%',
    height: 2,
    backgroundColor: '#10B981',
  },
  instructText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
});
