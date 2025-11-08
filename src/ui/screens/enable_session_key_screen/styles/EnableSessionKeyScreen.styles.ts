import { StyleSheet } from 'react-native';
import { Color } from '../../../shared/styles';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.BG_1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  icon: {
    marginBottom: 32,
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Color.FG_1,
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Color.FG_2,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  benefitsList: {
    width: '100%',
    marginBottom: 40,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
    fontSize: 15,
    color: Color.FG_1,
    lineHeight: 22,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  enableButton: {
    backgroundColor: Color.BG_1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  enableButtonDisabled: {
    opacity: 0.6,
  },
  enableButtonText: {
    color: Color.FG_1,
    fontSize: 16,
    fontWeight: '600',
  },
  skipButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Color.BG_1,
  },
  skipButtonText: {
    color: Color.FG_1,
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  loadingText: {
    color: Color.FG_2,
    fontSize: 14,
    marginTop: 8,
  },
  errorContainer: {
    width: '100%',
    marginBottom: 16,
    padding: 12,
    backgroundColor: Color.BG_2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Color.RED,
  },
  errorText: {
    color: Color.RED,
    fontSize: 14,
    textAlign: 'center',
  },
});

