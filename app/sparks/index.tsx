import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Button, Modal } from '../../src/components';
import { useAuthStore } from '../../src/store/auth.store';
import { sparksApi } from '../../src/services/api';
import { colors, fontSize, fontWeight, spacing, borderRadius, shadows } from '../../src/utils/theme';

interface SparkPack {
  id: string;
  name: string;
  sparks: number;
  price: number;
  bonus: number;
  isFeatured: boolean;
}

interface SparkPrice {
  open_nucleus: number;
  super_like: number;
  boost_30min: number;
  undo_swipe: number;
}

export default function SparksScreen() {
  const { user } = useAuthStore();
  const [packs, setPacks] = useState<SparkPack[]>([]);
  const [prices, setPrices] = useState<SparkPrice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [purchasedSparks, setPurchasedSparks] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [packsRes, pricesRes] = await Promise.all([
        sparksApi.getPacks(),
        sparksApi.getPrices(),
      ]);
      setPacks(packsRes.data);
      setPrices(pricesRes.data);
    } catch (error) {
      console.error('Error loading sparks data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (pack: SparkPack) => {
    setPurchaseLoading(pack.id);
    try {
      const response = await sparksApi.purchasePack(pack.id);
      setPurchasedSparks(response.data.sparksAdded);
      setShowSuccessModal(true);
      // Reload user data to update sparks balance
      // In a real app, you'd update the auth store
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setPurchaseLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.warning} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chispas</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Balance Card */}
        <Animated.View entering={FadeInDown.delay(100).springify()}>
          <LinearGradient
            colors={['#FFD700', '#FFA500', '#FF8C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceCard}
          >
            <View style={styles.balanceIconContainer}>
              <Ionicons name="flash" size={40} color="#1a1a2e" />
            </View>
            <View style={styles.balanceInfo}>
              <Text style={styles.balanceLabel}>Tu balance</Text>
              <Text style={styles.balanceValue}>{user?.sparks || 0}</Text>
              <Text style={styles.balanceSubtext}>chispas disponibles</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* What can you do */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <Text style={styles.sectionTitle}>Que puedes hacer con chispas?</Text>
          <View style={styles.actionsGrid}>
            <View style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Ionicons name="planet" size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionName}>Abrir Nucleo</Text>
              <Text style={styles.actionCost}>{prices?.open_nucleus || 10} chispas</Text>
            </View>

            <View style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                <Ionicons name="heart" size={24} color={colors.secondary} />
              </View>
              <Text style={styles.actionName}>Super Like</Text>
              <Text style={styles.actionCost}>{prices?.super_like || 5} chispas</Text>
            </View>

            <View style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(34, 211, 238, 0.15)' }]}>
                <Ionicons name="rocket" size={24} color={colors.accent} />
              </View>
              <Text style={styles.actionName}>Boost 30min</Text>
              <Text style={styles.actionCost}>{prices?.boost_30min || 12} chispas</Text>
            </View>

            <View style={styles.actionItem}>
              <View style={[styles.actionIcon, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                <Ionicons name="gift" size={24} color={colors.warning} />
              </View>
              <Text style={styles.actionName}>Regalos</Text>
              <Text style={styles.actionCost}>5-50 chispas</Text>
            </View>
          </View>
        </Animated.View>

        {/* Packs */}
        <Animated.View entering={FadeInDown.delay(300).springify()}>
          <Text style={styles.sectionTitle}>Comprar chispas</Text>
          <View style={styles.packsContainer}>
            {packs.map((pack, index) => (
              <Animated.View
                key={pack.id}
                entering={FadeInUp.delay(400 + index * 100).springify()}
              >
                <TouchableOpacity
                  style={[styles.packCard, pack.isFeatured && styles.packCardFeatured]}
                  onPress={() => handlePurchase(pack)}
                  disabled={purchaseLoading === pack.id}
                  activeOpacity={0.8}
                >
                  {pack.isFeatured && (
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredText}>Popular</Text>
                    </View>
                  )}

                  <View style={styles.packHeader}>
                    <Ionicons name="flash" size={28} color={colors.warning} />
                    <Text style={styles.packSparks}>{pack.sparks}</Text>
                    {pack.bonus > 0 && (
                      <Text style={styles.packBonus}>+{pack.bonus}</Text>
                    )}
                  </View>

                  <Text style={styles.packName}>{pack.name}</Text>

                  {pack.bonus > 0 && (
                    <Text style={styles.packBonusText}>
                      {pack.bonus} chispas gratis!
                    </Text>
                  )}

                  <View style={styles.packPriceContainer}>
                    {purchaseLoading === pack.id ? (
                      <ActivityIndicator size="small" color={colors.warning} />
                    ) : (
                      <Text style={styles.packPrice}>{formatPrice(pack.price)}</Text>
                    )}
                  </View>

                  <Text style={styles.packPerSpark}>
                    ${(pack.price / (pack.sparks + pack.bonus)).toFixed(3)}/chispa
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Info */}
        <Animated.View entering={FadeInDown.delay(600).springify()}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle" size={24} color={colors.textMuted} />
            <Text style={styles.infoText}>
              Las chispas son la moneda virtual de Linka. Usalas para conectar con personas,
              enviar regalos y destacar tu perfil. Los usuarios nuevos reciben 20 chispas gratis!
            </Text>
          </View>
        </Animated.View>

        {/* Transaction History Link */}
        <TouchableOpacity
          style={styles.historyLink}
          onPress={() => router.push('/sparks/history')}
        >
          <Ionicons name="time" size={20} color={colors.primary} />
          <Text style={styles.historyLinkText}>Ver historial de transacciones</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        type="success"
        title="Compra exitosa!"
        message={`Has recibido ${purchasedSparks} chispas. Ya puedes usarlas para conectar!`}
        buttonText="Genial!"
        onButtonPress={() => {
          setShowSuccessModal(false);
          router.back();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  headerRight: {
    width: 40,
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    ...shadows.lg,
  },
  balanceIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(26, 26, 46, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    color: 'rgba(26, 26, 46, 0.7)',
    fontSize: fontSize.sm,
  },
  balanceValue: {
    color: '#1a1a2e',
    fontSize: 42,
    fontWeight: fontWeight.bold,
    lineHeight: 48,
  },
  balanceSubtext: {
    color: 'rgba(26, 26, 46, 0.7)',
    fontSize: fontSize.sm,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  actionItem: {
    width: '50%',
    padding: spacing.sm,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionName: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  actionCost: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
  },
  packsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  packCard: {
    width: '100%',
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    marginHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
    ...shadows.sm,
  },
  packCardFeatured: {
    borderColor: colors.warning,
    borderWidth: 2,
  },
  featuredBadge: {
    position: 'absolute',
    top: -10,
    right: spacing.md,
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  featuredText: {
    color: '#1a1a2e',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  packHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  packSparks: {
    color: colors.text,
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    marginLeft: spacing.sm,
  },
  packBonus: {
    color: colors.success,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginLeft: spacing.xs,
  },
  packName: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    marginBottom: spacing.xs,
  },
  packBonusText: {
    color: colors.success,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
  packPriceContainer: {
    marginTop: spacing.sm,
  },
  packPrice: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  packPerSpark: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundCard,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  historyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  historyLinkText: {
    color: colors.primary,
    fontSize: fontSize.md,
  },
});
